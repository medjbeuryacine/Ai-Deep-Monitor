## ./go2rtc -config go2rtc.yaml


################################## TESTE URL YOUTUBE => RTSP =>HLS + IA ##################################







































################################## URL YOUTUBE => HLS + IA ##################################

import cv2
import numpy as np
import subprocess
import threading
import time
import os
import shutil
from fastapi import FastAPI, Query, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from ultralytics import YOLO
import asyncio
import re
import uuid
import logging
import aiofiles  # Ajoutez cet import en haut du fichier
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="YouTube to HLS with AI Detection")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ou spécifiez vos domaines
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modèles YOLO
model_general = YOLO("yolov8n.pt")
model_face = YOLO("yolov8n-face.pt")

# Configuration
ALLOWED_CLASSES = ["person", "phone"]
RTSP_PORT = 8554
HTTP_PORT = 8020
HLS_OUTPUT_DIR = "tmp/hls_output"
UPLOAD_DIR = "tmp/uploads"
PROCESSED_DIR = "tmp/processed"
HLS_SEGMENT_TIME = 2
HLS_LIST_SIZE = 5
GPU_IP = "192.168.1.153"


# Variables globales
processing_enabled = False
current_frame = None
frame_lock = threading.Lock()
detect_list = ["all"]
quality = "hd"
loop_video = False
current_url = None
url_change_event = threading.Event()
ffmpeg_rtsp_process = None
ffmpeg_hls_process = None
upload_tasks = {}

# Création des répertoires nécessaires
for directory in [HLS_OUTPUT_DIR, UPLOAD_DIR, PROCESSED_DIR]:
    os.makedirs(directory, exist_ok=True)



def cleanup_hls_output():
    """Nettoie le répertoire HLS de sortie."""
    if os.path.exists(HLS_OUTPUT_DIR):
        shutil.rmtree(HLS_OUTPUT_DIR)
    os.makedirs(HLS_OUTPUT_DIR, exist_ok=True)

def is_youtube_live(youtube_url):
    """Vérifie si l'URL est un live YouTube."""
    try:
        result = subprocess.run(
            ["yt-dlp", "--skip-download", "--print", "is_live", youtube_url],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip() == "True"
    except subprocess.CalledProcessError:
        return False

def get_youtube_stream(youtube_url):
    """Récupère le flux YouTube avec yt-dlp."""
    try:
        is_live = is_youtube_live(youtube_url)
        format_spec = "best" if is_live else "bestvideo[ext=mp4]/best[ext=mp4]/best"
        
        result = subprocess.run(
            ["yt-dlp", "-g", "-f", format_spec, youtube_url],
            capture_output=True, 
            text=True,
            check=True
        )
        return result.stdout.strip(), is_live
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur yt-dlp: {e.stderr}")
        return None, False

def detect_objects(frame):
    """Applique les détections IA sur une frame."""
    global detect_list
    
    # Détection objets
    if any(t in detect_list for t in ["person", "phone", "all"]):
        results = model_general(frame, conf=0.4)[0]
        for box in results.boxes:
            cls_id = int(box.cls[0].item())
            label = model_general.model.names[cls_id].lower()
            conf = float(box.conf[0].item())

            if ("all" in detect_list and label in ALLOWED_CLASSES) or (label in detect_list):
                x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # Détection visages
    if "face" in detect_list or "all" in detect_list:
        results = model_face(frame, conf=0.5)[0]
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
            cv2.putText(frame, "Face", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
    
    return frame

segments_generated = 0
last_segment_time = 0

def start_ffmpeg_processes():
    global segments_generated, last_segment_time, ffmpeg_hls_process
    
    # Nettoyer le répertoire HLS
    if os.path.exists(HLS_OUTPUT_DIR):
        shutil.rmtree(HLS_OUTPUT_DIR)
    os.makedirs(HLS_OUTPUT_DIR, exist_ok=True)
    
    segments_generated = 0
    last_segment_time = time.time()
    
    cmd = [
        'ffmpeg',
        '-y',
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', '1280x720' if quality == 'hd' else '854x480',
        '-r', '25',
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-f', 'hls',
        '-hls_time', '4',
        '-hls_list_size', '10',
        '-hls_flags', 'delete_segments+append_list',
        '-hls_segment_filename', f'{HLS_OUTPUT_DIR}/segment_%03d.ts',
        f'{HLS_OUTPUT_DIR}/stream.m3u8'
    ]
    
    ffmpeg_hls_process = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=10**8,
        universal_newlines=False
    )
    
    def monitor_segments():
        global segments_generated, last_segment_time
        while True:
            line = ffmpeg_hls_process.stderr.readline()
            if not line:
                break
            try:
                line_str = line.decode('utf-8', errors='replace')
                if 'Opening' in line_str and 'segment_' in line_str and '.ts' in line_str:
                    segments_generated += 1
                    last_segment_time = time.time()
                    print(f"Segment généré: {segments_generated}")
            except Exception as e:
                print(f"Erreur lecture sortie FFmpeg: {str(e)}")
    
    threading.Thread(target=monitor_segments, daemon=True).start()
    return ffmpeg_hls_process

def stop_ffmpeg_processes():
    """Arrête les processus FFmpeg."""
    global ffmpeg_rtsp_process, ffmpeg_hls_process
    
    if ffmpeg_rtsp_process:
        try:
            ffmpeg_rtsp_process.stdin.close()
            ffmpeg_rtsp_process.terminate()
        except:
            pass
        ffmpeg_rtsp_process = None
    
    if ffmpeg_hls_process:
        try:
            ffmpeg_hls_process.stdin.close()
            ffmpeg_hls_process.terminate()
        except:
            pass
        ffmpeg_hls_process = None

def video_processing_loop():
    """Boucle principale de traitement vidéo."""
    global current_frame, processing_enabled, current_url, url_change_event, ffmpeg_hls_process
    
    while processing_enabled:
        # Obtenir le flux YouTube
        stream_url, is_live = get_youtube_stream(current_url)
        if not stream_url:
            print("❌ Impossible d'obtenir le flux YouTube")
            time.sleep(2)
            continue
        
        print(f"🎥 Démarrage du traitement - URL: {current_url} - Live: {is_live}")
        
        # Démarrer FFmpeg HLS (sans RTSP)
        start_ffmpeg_processes()
        
        # Ouvrir la capture vidéo
        cap = cv2.VideoCapture(stream_url)
        if not cap.isOpened():
            print("❌ Impossible d'ouvrir le flux vidéo")
            time.sleep(2)
            continue
            
        print("✅ Flux vidéo ouvert avec succès")
        frame_count = 0
        
        try:
            while processing_enabled and not url_change_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    # Gestion des erreurs de lecture
                    continue
                
                # Traitement du frame
                processed_frame = detect_objects(frame)
                
                # Écriture sécurisée dans FFmpeg
                try:
                    if ffmpeg_hls_process and ffmpeg_hls_process.stdin:
                        ffmpeg_hls_process.stdin.write(processed_frame.tobytes())
                        ffmpeg_hls_process.stdin.flush()
                except BrokenPipeError:
                    logging.error("Connexion FFmpeg rompue, réinitialisation...")
                    stop_ffmpeg_processes()
                    start_ffmpeg_processes()
                    break
                
                frame_count += 1
                if frame_count % 100 == 0:
                    print(f"📊 Frames traitées: {frame_count}")
                
                # Traitement IA
                processed_frame = detect_objects(frame) if detect_list else frame
                
                # Redimensionner si nécessaire
                height, width = processed_frame.shape[:2]
                target_width = int(1280 if quality == "hd" else 854)
                target_height = int(720 if quality == "hd" else 480)
                
                if width != target_width or height != target_height:
                    processed_frame = cv2.resize(processed_frame, (target_width, target_height))
                
                # Mettre à jour le frame pour HTTP
                with frame_lock:
                    current_frame = processed_frame.copy()
                
                # Envoyer directement à FFmpeg HLS
                try:
                    ffmpeg_hls_process.stdin.write(processed_frame.tobytes())
                except BrokenPipeError:
                    print("⚠️ Connexion FFmpeg interrompue, réinitialisation...")
                    stop_ffmpeg_processes()
                    start_ffmpeg_processes()
                    break
                
                # Contrôle de débit pour vidéos normales
                if not is_live:
                    time.sleep(0.033)  # ~30 FPS
                    
        except Exception as e:
            print(f"❌ Erreur traitement vidéo: {str(e)}")
        finally:
            cap.release()
            stop_ffmpeg_processes()
            
        if url_change_event.is_set():
            url_change_event.clear()
            continue
            
        if processing_enabled:
            time.sleep(2)
    
    print("🛑 Traitement vidéo terminé")

async def process_uploaded_video(file_path, output_path, detect_opts, quality_opt="hd"):
    """Traite une vidéo uploadée avec détection IA."""
    # Configuration
    resolution = "1280:720" if quality_opt == "hd" else "854:480"
    
    # Ouvrir la vidéo
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        print(f"❌ Impossible d'ouvrir la vidéo uploadée: {file_path}")
        return False
    
    # Paramètres de la vidéo
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Ajuster la taille de sortie
    target_width = int(1280 if quality_opt == "hd" else 854)
    target_height = int(720 if quality_opt == "hd" else 480)
    
    # Configurer le writer vidéo
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (target_width, target_height))
    
    print(f"🎬 Traitement vidéo: {file_path} -> {output_path}")
    print(f"📏 Résolution: {width}x{height} -> {target_width}x{target_height}")
    print(f"⏱️ FPS: {fps}, Frames totales: {total_frames}")
    
    frame_count = 0
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_count += 1
            if frame_count % 100 == 0:
                progress = (frame_count / total_frames) * 100
                print(f"⏳ Progression: {progress:.1f}% ({frame_count}/{total_frames})")
            
            # Appliquer la détection IA
            processed_frame = detect_objects(frame) if detect_opts else frame
            
            # Redimensionner si nécessaire
            if width != target_width or height != target_height:
                processed_frame = cv2.resize(processed_frame, (target_width, target_height))
            
            # Écrire la frame traitée
            out.write(processed_frame)
            
            # Pour éviter de bloquer le thread principal
            if frame_count % 10 == 0:
                await asyncio.sleep(0.001)
    
    except Exception as e:
        print(f"❌ Erreur traitement vidéo uploadée: {str(e)}")
        return False
    finally:
        cap.release()
        out.release()
    
    # Conversion finale en MP4 lisible partout
    try:
        temp_output = f"{output_path}_temp.mp4"
        os.rename(output_path, temp_output)
        
        ffmpeg_cmd = [
            'ffmpeg', '-i', temp_output,
            '-c:v', 'libx264', '-preset', 'medium',
            '-crf', '23', '-pix_fmt', 'yuv420p',
            output_path
        ]
        
        subprocess.run(ffmpeg_cmd, check=True)
        os.remove(temp_output)
        
        print(f"✅ Traitement vidéo terminé: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Erreur conversion finale: {str(e)}")
        return False

@app.get("/api/start")
async def start_processing(
    url: str = Query(..., description="URL YouTube"),
    detect: str = Query("all", description="Objets à détecter (person,face,phone,all)"),
    q: str = Query("hd", description="Qualité: hd ou low"),
    loop: bool = Query(False, description="Boucler la vidéo normale"),
    title: str = Query(None)  # Nouveau paramètre pour le titre
):
    """Démarre le traitement vidéo."""
    global processing_enabled, detect_list, quality, loop_video, current_url, url_change_event

    # Valider les paramètres
    valid_targets = {"person", "face", "phone", "all"}
    detect_list = [d.strip().lower() for d in detect.split(",") if d.strip().lower() in valid_targets]
    if not detect_list:
        detect_list = ["all"]

    quality = q if q in ["hd", "low"] else "hd"
    loop_video = loop
    
    # Si déjà en cours, simplement mettre à jour l'URL
    if processing_enabled:
        current_url = url
        url_change_event.set()
    else:
        # Sinon démarrer le traitement
        current_url = url
        processing_enabled = True
        threading.Thread(
            target=video_processing_loop,
            daemon=True
        ).start()

    # Utiliser le titre dans les logs
    print(f"Démarrage traitement pour: {title or url}")

    return JSONResponse({
        "status": "Traitement démarré" if not processing_enabled else "URL mise à jour",
        "url": url,
        "targets": detect_list,
        "quality": quality,
        "loop": loop_video,
        "hls_stream": f"http://{GPU_IP}:{HTTP_PORT}/hls/stream.m3u8",
        "mjpeg_stream": f"http://localhost:{HTTP_PORT}/stream.mjpg"
    })

@app.get("/api/stop")
async def stop_processing():
    """Arrête le traitement vidéo."""
    global processing_enabled
    
    if not processing_enabled:
        return JSONResponse(
            status_code=400,
            content={"error": "Aucun traitement en cours"}
        )
    
    processing_enabled = False
    stop_ffmpeg_processes()
    
    return JSONResponse({"status": "Traitement arrêté"})

@app.get("/api/status")
async def get_status():
    return JSONResponse({
        "active": processing_enabled,
        "segments_generated": segments_generated,
        "last_segment_time": last_segment_time,
        "hls_url": f"http://{GPU_IP}:{HTTP_PORT}/hls/stream.m3u8"
    })

@app.get("/hls/{filename}")
async def serve_hls_file(filename: str):
    file_path = os.path.join(HLS_OUTPUT_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404)
    return FileResponse(file_path)


@app.get("/stream_upload/{task_id}")
async def stream_uploaded_video(task_id: str):
    """Stream la vidéo traitée avec détection IA."""
    if task_id not in upload_tasks:
        return JSONResponse(
            status_code=404,
            content={"error": "Vidéo non trouvée"}
        )
    
    task = upload_tasks[task_id]
    
    # Vérifier si le traitement est terminé
    if not task["future"].done():
        return JSONResponse(
            status_code=425,  # Too Early
            content={"error": "La vidéo est encore en traitement"}
        )
    
    if task["future"].exception():
        return JSONResponse(
            status_code=500,
            content={"error": "Erreur lors du traitement"}
        )
    
    # Streamer la vidéo traitée
    def generate():
        cap = cv2.VideoCapture(task["output_path"])
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Boucler la vidéo
                continue
            
            # Appliquer la détection IA si nécessaire
            if task.get("detect", ["all"]) != ["none"]:
                frame = detect_objects(frame)
            
            _, buffer = cv2.imencode('.jpg', frame, [
                int(cv2.IMWRITE_JPEG_QUALITY), 70
            ])
            frame_data = buffer.tobytes()
            
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n"
            )
            time.sleep(0.033)  # ~30 FPS
        
        cap.release()
    
    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.post("/api/upload")
async def gpu_upload(
    file: UploadFile = File(...),
    detect: str = Form("all"),
    q: str = Form("hd")
):
    try:
        # 1. Validation du fichier
        if not file.filename.lower().endswith('.mp4'):
            raise HTTPException(400, "Format MP4 requis")

        # 2. Création du dossier de traitement
        task_id = str(uuid.uuid4())
        proc_dir = f"processing/{task_id}"
        os.makedirs(proc_dir, exist_ok=True)
        
        # 3. Sauvegarde du fichier
        input_path = f"{proc_dir}/input.mp4"
        async with aiofiles.open(input_path, "wb") as f:
            while chunk := await file.read(1024*1024):  # 1MB chunks
                await f.write(chunk)

        # 4. Lancement du traitement
        asyncio.create_task(
            process_video_task(task_id, input_path, detect, q)
        )
        
        return {"task_id": task_id}

    except Exception as e:
        if 'proc_dir' in locals():
            shutil.rmtree(proc_dir, ignore_errors=True)
        raise HTTPException(500, f"Erreur GPU: {str(e)}")

async def process_video_task(task_id: str, input_path: str, detect: str, quality: str):
    """Tâche de traitement vidéo avec IA"""
    try:
        output_path = f"processing/{task_id}/output.mp4"
        
        # Initialisation des modèles IA
        model = YOLO("yolov8n.pt")
        
        # Traitement vidéo
        cap = cv2.VideoCapture(input_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        # Configuration encodeur
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Traitement frame par frame
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Détection IA
            results = model(frame)
            annotated_frame = results[0].plot()
            
            out.write(annotated_frame)
        
        # Nettoyage
        cap.release()
        out.release()
        os.remove(input_path)
        
    except Exception as e:
        print(f"Erreur traitement: {str(e)}")
    finally:
        if 'cap' in locals():
            cap.release()
        if 'out' in locals():
            out.release()

@app.get("/api/status/{task_id}")
async def get_status(task_id: str):
    """Endpoint de vérification de statut"""
    if not os.path.exists(f"processing/{task_id}"):
        raise HTTPException(404, "Tâche introuvable")
    
    if os.path.exists(f"processing/{task_id}/output.mp4"):
        return {
            "status": "completed",
            "download_url": f"/download/{task_id}"
        }
    return {"status": "processing"}

@app.get("/download/{task_id}")
async def download_video(task_id: str):
    """Téléchargement de la vidéo traitée"""
    video_path = f"processing/{task_id}/output.mp4"
    if not os.path.exists(video_path):
        raise HTTPException(404, "Vidéo non disponible")
    
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=f"processed_{task_id}.mp4"
    )


@app.get("/stream.mjpg")
async def video_feed():
    """Flux vidéo HTTP MJPEG."""
    async def generate():
        while True:
            with frame_lock:
                if current_frame is None:
                    await asyncio.sleep(0.1)
                    continue
                
                _, buffer = cv2.imencode('.jpg', current_frame, [
                    int(cv2.IMWRITE_JPEG_QUALITY), 70
                ])
                frame_data = buffer.tobytes()

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n"
            )
            await asyncio.sleep(0.03)

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/hls/{file_path:path}")
async def serve_hls(file_path: str):
    file_location = f"{HLS_OUTPUT_DIR}/{file_path}"
    if not os.path.exists(file_location):
        raise HTTPException(status_code=404)
    
    return FileResponse(
        file_location,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache"
        }
    )

@app.get("/")
def accueil():
    return {"message": "API YouTube to HLS avec détection IA et upload de vidéos"}



if __name__ == '__main__':
    # Créer les répertoires nécessaires
    for directory in [HLS_OUTPUT_DIR, UPLOAD_DIR, PROCESSED_DIR]:
        os.makedirs(directory, exist_ok=True)
    print("Dossiers créés avec succès")
    
    # Démarrer le serveur
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8020)





















































































































