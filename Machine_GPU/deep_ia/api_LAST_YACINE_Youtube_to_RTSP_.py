# import cv2
# import numpy as np
# import subprocess
# import threading
# import time
# from fastapi import FastAPI, Query, Request
# from fastapi.responses import JSONResponse, StreamingResponse, HTMLResponse
# from typing import List, Optional
# from ultralytics import YOLO
# import asyncio
# import re

# app = FastAPI(title="YouTube to RTSP/HTTP with AI Detection")

# # Modèles YOLO
# model_general = YOLO("yolov8n.pt")
# model_face = YOLO("yolov8n-face.pt")

# # Configuration
# ALLOWED_CLASSES = ["person", "phone"]  # Classes autorisées
# RTSP_OUTPUT = "rtsp://localhost:8554/detection"  # Flux RTSP de sortie
# HTTP_PORT = 8020  # Port HTTP pour le flux MJPEG

# # Variables globales
# ffmpeg_process = None
# processing_enabled = False
# current_frame = None
# frame_lock = threading.Lock()
# detect_list = ["all"]
# quality = "hd"
# loop_video = False
# video_type = "unknown"  # 'live' ou 'normal'
# current_url = None  # Pour stocker l'URL actuelle
# url_change_event = threading.Event()  # Pour signaler un changement d'URL

# def is_youtube_live(youtube_url):
#     """Vérifie si l'URL est un live YouTube."""
#     try:
#         result = subprocess.run(
#             ["yt-dlp", "--skip-download", "--print", "is_live", youtube_url],
#             capture_output=True,
#             text=True,
#             check=True
#         )
#         return result.stdout.strip() == "True"
#     except subprocess.CalledProcessError:
#         return False

# def get_youtube_stream(youtube_url):
#     """Récupère le flux YouTube avec yt-dlp, optimisé pour vidéos normales et livestreams."""
#     global video_type
    
#     try:
#         # Vérifier d'abord si c'est un livestream
#         video_type = "live" if is_youtube_live(youtube_url) else "normal"
#         print(f"📊 Type de vidéo détecté: {video_type}")
        
#         if video_type == "live":
#             # Pour les livestreams, utiliser la meilleure qualité
#             result = subprocess.run(
#                 ["yt-dlp", "-g", "-f", "best", youtube_url],
#                 capture_output=True, 
#                 text=True,
#                 check=True
#             )
#         else:
#             # Pour les vidéos normales, spécifier format vidéo (pas audio)
#             result = subprocess.run(
#                 ["yt-dlp", "-g", "-f", "bestvideo[ext=mp4]/best[ext=mp4]/best", youtube_url],
#                 capture_output=True, 
#                 text=True,
#                 check=True
#             )
        
#         return result.stdout.strip()
#     except subprocess.CalledProcessError as e:
#         print(f"❌ Erreur yt-dlp: {e.stderr}")
#         return None

# def detect_objects(frame):
#     """Applique les détections IA sur une frame."""
#     global detect_list
    
#     # Détection objets
#     if any(t in detect_list for t in ["person", "phone", "all"]):
#         results = model_general(frame, conf=0.4)[0]
#         for box in results.boxes:
#             cls_id = int(box.cls[0].item())
#             label = model_general.model.names[cls_id].lower()
#             conf = float(box.conf[0].item())

#             if ("all" in detect_list and label in ALLOWED_CLASSES) or (label in detect_list):
#                 x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
#                 cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
#                             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
#     # Détection visages
#     if "face" in detect_list or "all" in detect_list:
#         results = model_face(frame, conf=0.5)[0]
#         for box in results.boxes:
#             x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
#             cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
#             cv2.putText(frame, "Face", (x1, y1 - 10),
#                         cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
    
#     return frame

# def video_processing_loop():
#     """Boucle principale de traitement vidéo, améliorée pour vidéos normales et livestreams."""
#     global current_frame, processing_enabled, ffmpeg_process, quality, detect_list, loop_video, video_type, current_url
    
#     # Configuration FFmpeg initiale
#     resolution = "1280:720" if quality == "hd" else "854:480"
#     bitrate = "2000k" if quality == "hd" else "800k"
    
#     ffmpeg_command = [
#         'ffmpeg',
#         '-y', '-f', 'rawvideo',
#         '-vcodec', 'rawvideo',
#         '-pix_fmt', 'bgr24',
#         '-s', resolution,
#         '-r', '25',
#         '-i', '-',
#         '-c:v', 'libx264',
#         '-preset', 'ultrafast',
#         '-b:v', bitrate,
#         '-f', 'rtsp',
#         RTSP_OUTPUT
#     ]
    
#     ffmpeg_process = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)
    
#     # Boucle principale de traitement
#     while processing_enabled:
#         # Vérifier s'il y a eu un changement d'URL
#         if url_change_event.is_set():
#             print(f"🔄 Changement d'URL détecté: {current_url}")
#             url_change_event.clear()
            
#         # Obtenir le flux pour l'URL actuelle
#         stream_url = get_youtube_stream(current_url)
#         if not stream_url:
#             print("❌ Impossible d'obtenir le flux YouTube")
#             time.sleep(2)  # Attendre avant de réessayer
#             continue
            
#         print(f"🎥 Traitement en cours - Type: {video_type} - URL: {current_url} - RTSP: {RTSP_OUTPUT}")
        
#         # Extraire l'ID YouTube pour surveillance
#         youtube_id = None
#         youtube_regex = r"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\s]{11})"
#         match = re.search(youtube_regex, current_url)
#         if match:
#             youtube_id = match.group(1)
        
#         # Ouvrir la capture vidéo
#         cap = cv2.VideoCapture(stream_url)
#         if not cap.isOpened():
#             print("❌ Impossible d'ouvrir le flux vidéo")
#             time.sleep(2)
#             continue
            
#         print(f"✅ Flux vidéo ouvert avec succès")
#         frame_count = 0
        
#         try:
#             while processing_enabled and not url_change_event.is_set():
#                 ret, frame = cap.read()
                
#                 # Si on atteint la fin du flux
#                 if not ret:
#                     if video_type == "live":
#                         print("⚠️ Problème avec le livestream, tentative de reconnexion...")
#                         break  # Sortir pour reconnecter
#                     else:  # Vidéo normale
#                         if loop_video:
#                             print("🔄 Fin de la vidéo, redémarrage...")
#                             break  # Sortir pour rouvrir le flux
#                         else:
#                             print("🏁 Fin de la vidéo atteinte")
#                             break
#                     continue
                
#                 frame_count += 1
#                 if frame_count % 100 == 0:
#                     print(f"📊 Traitement en cours: {frame_count} frames")
                
#                 # Traitement IA
#                 processed_frame = detect_objects(frame) if detect_list else frame
                
#                 # Redimensionner si nécessaire
#                 height, width = processed_frame.shape[:2]
#                 target_width = int(resolution.split(':')[0])
#                 target_height = int(resolution.split(':')[1])
                
#                 if width != target_width or height != target_height:
#                     processed_frame = cv2.resize(processed_frame, (target_width, target_height))
                
#                 # Mettre à jour le frame pour HTTP
#                 with frame_lock:
#                     current_frame = processed_frame.copy()
                
#                 # Envoyer au flux RTSP
#                 try:
#                     ffmpeg_process.stdin.write(processed_frame.tobytes())
#                 except BrokenPipeError:
#                     print("⚠️ Connexion RTSP interrompue, réinitialisation...")
#                     # Recréer le processus FFmpeg
#                     try:
#                         ffmpeg_process.terminate()
#                     except:
#                         pass
#                     ffmpeg_process = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)
#                     break
                
#                 # Contrôle de débit pour vidéos normales
#                 if video_type == "normal":
#                     time.sleep(0.033)  # ~30 FPS
                    
#         except Exception as e:
#             print(f"❌ Erreur traitement vidéo: {str(e)}")
#         finally:
#             cap.release()
            
#         # Si on a un changement d'URL, on recommence la boucle principale
#         if url_change_event.is_set():
#             continue
            
#         # Si on arrive ici sans changement d'URL mais toujours en traitement, attendre avant de réessayer
#         if processing_enabled:
#             time.sleep(2)
    
#     # Nettoyage final
#     if ffmpeg_process:
#         try:
#             ffmpeg_process.stdin.close()
#         except:
#             pass
#         ffmpeg_process.terminate()
    
#     print("🛑 Traitement vidéo terminé")

# @app.get("/api/start")
# async def start_processing(
#     url: str = Query(..., description="URL YouTube (live ou vidéo normale)"),
#     detect: str = Query("all", description="Objets à détecter (person,face,phone,all)"),
#     q: str = Query("hd", description="Qualité: hd ou low"),
#     loop: bool = Query(False, description="Boucler la vidéo normale")
# ):
#     """Démarre le traitement vidéo ou change l'URL si déjà en cours."""
#     global processing_enabled, detect_list, quality, loop_video, current_url, url_change_event

#     # Valider les paramètres
#     valid_targets = {"person", "face", "phone", "all"}
#     detect_list = [d.strip().lower() for d in detect.split(",") if d.strip().lower() in valid_targets]
#     if not detect_list:
#         detect_list = ["all"]

#     quality = q if q in ["hd", "low"] else "hd"
#     loop_video = loop
    
#     # Si déjà en cours, simplement mettre à jour l'URL
#     if processing_enabled:
#         # Mettre à jour l'URL et signaler le changement
#         current_url = url
#         url_change_event.set()
        
#         return JSONResponse({
#             "status": "URL mise à jour",
#             "url": url,
#             "targets": detect_list,
#             "quality": quality,
#             "loop": loop_video,
#             "rtsp_stream": RTSP_OUTPUT,
#             "http_stream": f"http://localhost:{HTTP_PORT}/stream.mjpg",
#             "view_url": f"http://localhost:{HTTP_PORT}/api/view"
#         })
    
#     # Sinon démarrer le traitement
#     current_url = url
#     processing_enabled = True
#     threading.Thread(
#         target=video_processing_loop,
#         daemon=True
#     ).start()

#     return JSONResponse({
#         "status": "Traitement démarré",
#         "url": url,
#         "targets": detect_list,
#         "quality": quality,
#         "loop": loop_video,
#         "rtsp_stream": RTSP_OUTPUT,
#         "http_stream": f"http://localhost:{HTTP_PORT}/stream.mjpg",
#         "view_url": f"http://localhost:{HTTP_PORT}/api/view"
#     })

# @app.get("/api/stop")
# async def stop_processing():
#     """Arrête le traitement vidéo."""
#     global processing_enabled, ffmpeg_process
    
#     if not processing_enabled:
#         return JSONResponse(
#             status_code=400,
#             content={"error": "Aucun traitement en cours"}
#         )
    
#     processing_enabled = False
#     if ffmpeg_process:
#         try:
#             ffmpeg_process.stdin.close()
#         except:
#             pass
#         ffmpeg_process.terminate()
    
#     return JSONResponse({"status": "Traitement arrêté"})

# @app.get("/api/status")
# async def get_status():
#     """Retourne le statut actuel."""
#     global video_type, current_url
    
#     return JSONResponse({
#         "active": processing_enabled,
#         "url": current_url,
#         "detecting": detect_list,
#         "quality": quality,
#         "loop": loop_video,
#         "video_type": video_type,
#         "rtsp_stream": RTSP_OUTPUT,
#         "http_stream": f"http://localhost:{HTTP_PORT}/stream.mjpg",
#         "view_url": f"http://localhost:{HTTP_PORT}/api/view"
#     })

# @app.get("/stream.mjpg")
# async def video_feed():
#     """Flux vidéo HTTP MJPEG."""
#     async def generate():
#         while True:
#             with frame_lock:
#                 if current_frame is None:
#                     await asyncio.sleep(0.1)
#                     continue
                
#                 _, buffer = cv2.imencode('.jpg', current_frame, [
#                     int(cv2.IMWRITE_JPEG_QUALITY), 70
#                 ])
#                 frame_data = buffer.tobytes()

#             yield (
#                 b"--frame\r\n"
#                 b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n"
#             )
#             await asyncio.sleep(0.03)  # ~30 FPS

#     return StreamingResponse(
#         generate(),
#         media_type="multipart/x-mixed-replace; boundary=frame"
#     )

# @app.get("/api/view")
# async def view_video():
#     """Affiche directement le flux vidéo via un stream MJPEG."""
#     async def generate():
#         while True:
#             with frame_lock:
#                 if current_frame is None:
#                     await asyncio.sleep(0.1)
#                     continue
                
#                 _, buffer = cv2.imencode('.jpg', current_frame, [
#                     int(cv2.IMWRITE_JPEG_QUALITY), 70
#                 ])
#                 frame_data = buffer.tobytes()

#             yield (
#                 b"--frame\r\n"
#                 b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n"
#             )
#             await asyncio.sleep(0.03)  # ~30 FPS

#     return StreamingResponse(
#         generate(),
#         media_type="multipart/x-mixed-replace; boundary=frame"
#     )

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT)






################################################################################################################
###################### TESTE AVEC YOUTUBE URL => RTSP (SANS DETECTION IA) ######################################
################################################################################################################

######################## MARCHE TRES BIEN AVEC YOUTUBE VIDEO NORMALE (PROBLEME VIDEO LIVE) => RTSP ###########################################


# import subprocess
# import threading
# import time
# import re
# from fastapi import FastAPI, Query, HTTPException
# from fastapi.responses import JSONResponse
# import logging

# # Configuration du logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="YouTube to RTSP Converter - Stable Version")

# # Configuration
# RTSP_YOUTUBE_NORMAL = "rtsp://localhost:8554/youtube"
# RTSP_YOUTUBE_LIVE = "rtsp://localhost:8554/youtubelive"
# HTTP_PORT = 8022

# # Variables globales
# current_process = None
# process_lock = threading.Lock()
# restart_event = threading.Event()
# active_url = None

# def is_youtube_live(youtube_url: str) -> bool:
#     """Vérifie si l'URL est un live YouTube avec timeout."""
#     try:
#         result = subprocess.run(
#             ["yt-dlp", "--no-warnings", "--socket-timeout", "10", "--skip-download", "--print", "is_live", youtube_url],
#             capture_output=True,
#             text=True,
#             timeout=15,
#             check=True
#         )
#         return result.stdout.strip() == "True"
#     except Exception as e:
#         logger.error(f"Erreur vérification live: {str(e)}")
#         return False

# def get_stream_url(youtube_url: str) -> str:
#     """Récupère l'URL du flux avec des paramètres optimisés."""
#     try:
#         cmd = [
#             "yt-dlp",
#             "--no-warnings",
#             "--no-cookies",
#             "--no-check-certificate",
#             "--geo-bypass",
#             "--socket-timeout", "15",
#             "-g",
#             "-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
#         ]
        
#         # Configuration différente pour les lives
#         if is_youtube_live(youtube_url):
#             cmd.extend(["--live-from-start", "--hls-use-mpegts"])
        
#         cmd.append(youtube_url)
        
#         result = subprocess.run(
#             cmd,
#             capture_output=True,
#             text=True,
#             timeout=20,
#             check=True
#         )
#         return result.stdout.strip()
#     except subprocess.TimeoutExpired:
#         logger.error("Timeout lors de la récupération du flux YouTube")
#         raise
#     except Exception as e:
#         logger.error(f"Erreur yt-dlp: {str(e)}")
#         raise

# def manage_stream(youtube_url: str):
#     """Gestion principale du flux avec reconnection automatique."""
#     global current_process, active_url
    
#     while not restart_event.is_set():
#         try:
#             stream_url = get_stream_url(youtube_url)
#             if not stream_url:
#                 time.sleep(5)
#                 continue
                
#             is_live = is_youtube_live(youtube_url)
#             rtsp_output = RTSP_YOUTUBE_LIVE if is_live else RTSP_YOUTUBE_NORMAL
            
#             ffmpeg_cmd = build_ffmpeg_command(stream_url, rtsp_output, is_live)
#             logger.info(f"Démarrage du flux: {' '.join(ffmpeg_cmd)}")
            
#             with process_lock:
#                 if restart_event.is_set():
#                     break
                    
#                 # Arrêt propre de l'ancien processus
#                 if current_process:
#                     try:
#                         current_process.terminate()
#                         current_process.wait(timeout=5)
#                     except:
#                         pass
                
#                 # Démarrage du nouveau processus
#                 current_process = subprocess.Popen(
#                     ffmpeg_cmd,
#                     stdin=subprocess.PIPE,
#                     stderr=subprocess.PIPE,
#                     universal_newlines=True
#                 )
#                 active_url = youtube_url
            
#             # Surveillance du processus
#             while not restart_event.is_set():
#                 retcode = current_process.poll()
#                 if retcode is not None:
#                     logger.warning(f"FFmpeg s'est arrêté (code: {retcode}), reconnexion...")
#                     time.sleep(2)
#                     break
                
#                 # Vérification de la sortie d'erreur
#                 line = current_process.stderr.readline()
#                 if line:
#                     logger.debug(f"FFmpeg: {line.strip()}")
#                     if "error" in line.lower() or "fail" in line.lower():
#                         logger.error("Erreur détectée dans FFmpeg, reconnexion...")
#                         current_process.terminate()
#                         time.sleep(2)
#                         break
                
#                 time.sleep(1)
                
#         except Exception as e:
#             logger.error(f"Erreur dans manage_stream: {str(e)}")
#             time.sleep(5)

# def build_ffmpeg_command(input_url: str, output_url: str, is_live: bool) -> list:
#     """Construit la commande FFmpeg optimisée."""
#     base_cmd = [
#         "ffmpeg",
#         "-hide_banner",
#         "-loglevel", "error",
#         "-fflags", "+genpts+discardcorrupt",
#         "-analyzeduration", "10M",
#         "-probesize", "10M",
#     ]
    
#     # Options spécifiques pour les lives
#     if is_live:
#         base_cmd.extend([
#             "-reconnect", "1",
#             "-reconnect_at_eof", "1",
#             "-reconnect_streamed", "1",
#             "-reconnect_delay_max", "5",
#             "-timeout", "3000000",
#             "-i", input_url,
#             "-c:v", "copy",
#             "-c:a", "copy",
#             "-f", "rtsp",
#             "-rtsp_transport", "tcp",
#             "-muxdelay", "0.1",
#             "-flush_packets", "1",
#             output_url
#         ])
#     else:
#         # Options pour vidéos normales
#         base_cmd.extend([
#             "-re",
#             "-i", input_url,
#             "-c:v", "copy",
#             "-c:a", "copy",
#             "-f", "rtsp",
#             "-rtsp_transport", "tcp",
#             "-muxdelay", "0.5",
#             output_url
#         ])
    
#     return base_cmd

# @app.get("/api/start")
# async def start_processing(
#     url: str = Query(..., description="URL YouTube (live ou vidéo normale)"),
# ):
#     """Démarre ou met à jour le flux."""
#     global restart_event
    
#     # Validation de l'URL
#     if not re.match(r"^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)", url.lower()):
#         raise HTTPException(status_code=400, detail="URL YouTube invalide")
    
#     # Signal de redémarrage
#     restart_event.set()
#     time.sleep(1)  # Attente pour l'arrêt propre
#     restart_event.clear()
    
#     # Démarrer le nouveau flux dans un thread
#     threading.Thread(
#         target=manage_stream,
#         args=(url,),
#         daemon=True
#     ).start()
    
#     return JSONResponse({
#         "status": "Traitement démarré/mis à jour",
#         "url": url,
#         "rtsp_stream": RTSP_YOUTUBE_LIVE if is_youtube_live(url) else RTSP_YOUTUBE_NORMAL
#     })

# @app.get("/api/stop")
# async def stop_processing():
#     """Arrête complètement le flux."""
#     global current_process, restart_event
    
#     restart_event.set()
#     with process_lock:
#         if current_process:
#             try:
#                 current_process.terminate()
#                 current_process.wait(timeout=5)
#             except:
#                 pass
#             current_process = None
    
#     return JSONResponse({"status": "Flux arrêté"})

# @app.get("/api/status")
# async def get_status():
#     """Retourne le statut actuel."""
#     is_active = False
#     with process_lock:
#         if current_process and current_process.poll() is None:
#             is_active = True
    
#     return JSONResponse({
#         "active": is_active,
#         "current_url": active_url,
#         "is_live": is_youtube_live(active_url) if active_url else None
#     })

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT, log_level="info")




################## test ##################################################

# api_LAST_YACINE_Youtube_to_RTSP_.py

import subprocess
import threading
import time
import re
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
import logging
import requests
import shutil
import os


# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YouTube to RTSP Converter - Stable Version")

# Configuration
RTSP_YOUTUBE_NORMAL = "rtsp://localhost:8554/youtube"
RTSP_YOUTUBE_LIVE = "rtsp://localhost:8554/youtubelive"
HTTP_PORT = 8022

# Variables globales
current_process = None
process_lock = threading.Lock()
restart_event = threading.Event()
active_url = None

def is_youtube_live(youtube_url: str) -> bool:
    """Vérifie si l'URL est un live YouTube avec timeout."""
    try:
        result = subprocess.run(
            ["yt-dlp", "--no-warnings", "--cookies", "cookies.txt", "--socket-timeout", "10", "--skip-download", "--print", "is_live", youtube_url],
            capture_output=True,
            text=True,
            timeout=15,
            check=True
        )
        return result.stdout.strip() == "True"
    except Exception as e:
        logger.error(f"Erreur vérification live: {str(e)}")
        return False

def get_stream_url(youtube_url: str) -> str:
    """Récupère l'URL du flux avec des paramètres optimisés."""
    try:
        is_live_stream = is_youtube_live(youtube_url)
        logger.info(f"URL YouTube: {youtube_url}, est live: {is_live_stream}")
        
        if is_live_stream:
            # Pour les flux en direct, utilisez une approche spécifique
            cmd = [
                "yt-dlp",
                "--no-warnings",
                "--cookies", "cookies.txt",  # ajouté ici
                "-g",
                "-f", "94/95/96/best",
                youtube_url
            ]
        else:
            # Format pour les vidéos normales (reste inchangé)
            cmd = [
                "yt-dlp",
                "--no-warnings",
                "--cookies", "cookies.txt",  # ajouté ici
                "--no-check-certificate",
                "--geo-bypass",
                "--socket-timeout", "15",
                "-g",
                "-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                youtube_url
            ]
        
        logger.info(f"Exécution de la commande yt-dlp: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=20
        )
        
        # Log the output and any errors
        if result.stdout:
            logger.info(f"yt-dlp stdout: {result.stdout.strip()}")
        if result.stderr:
            logger.error(f"yt-dlp stderr: {result.stderr.strip()}")
            
        if result.returncode != 0:
            raise Exception(f"yt-dlp a échoué avec le code {result.returncode}: {result.stderr}")
            
        return result.stdout.strip()
    except Exception as e:
        logger.error(f"Erreur yt-dlp: {str(e)}")
        raise

def manage_stream(youtube_url: str):
    """Gestion principale du flux avec reconnection automatique."""
    global current_process, active_url
    
    while not restart_event.is_set():
        try:
            logger.info(f"Tentative de récupération de l'URL du flux pour: {youtube_url}")
            stream_url = get_stream_url(youtube_url)
            if not stream_url:
                logger.error("URL du flux vide reçue")
                time.sleep(5)
                continue
                
            is_live = is_youtube_live(youtube_url)
            rtsp_output = RTSP_YOUTUBE_LIVE if is_live else RTSP_YOUTUBE_NORMAL
            
            ffmpeg_cmd = build_ffmpeg_command(stream_url, rtsp_output, is_live)
            logger.info(f"Démarrage du flux: {' '.join(ffmpeg_cmd)}")
            
            with process_lock:
                if restart_event.is_set():
                    break
                    
                # Arrêt propre de l'ancien processus
                if current_process:
                    try:
                        current_process.terminate()
                        current_process.wait(timeout=5)
                    except:
                        pass
                
                # Démarrage du nouveau processus avec capture complète de la sortie
                current_process = subprocess.Popen(
                    ffmpeg_cmd,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True
                )
                active_url = youtube_url
            
            # Surveillance du processus
            while not restart_event.is_set():
                retcode = current_process.poll()
                if retcode is not None:
                    # Capture toute la sortie d'erreur lorsque le processus se termine
                    error_output = ""
                    for line in current_process.stderr:
                        error_output += line
                    
                    logger.warning(f"FFmpeg s'est arrêté (code: {retcode})")
                    if error_output:
                        logger.error(f"Erreur FFmpeg: {error_output}")
                    
                    time.sleep(2)
                    break
                
                # Vérification de la sortie d'erreur en temps réel
                stderr_line = ""
                try:
                    # Lecture non-bloquante
                    import select
                    if select.select([current_process.stderr], [], [], 0)[0]:
                        stderr_line = current_process.stderr.readline()
                except Exception:
                    pass
                
                if stderr_line:
                    logger.debug(f"FFmpeg stderr: {stderr_line.strip()}")
                    if "error" in stderr_line.lower() or "fail" in stderr_line.lower() or "could not" in stderr_line.lower():
                        logger.error(f"Erreur FFmpeg détectée: {stderr_line}")
                        current_process.terminate()
                        time.sleep(2)
                        break
                
                time.sleep(1)
                
        except Exception as e:
            logger.error(f"Erreur dans manage_stream: {str(e)}")
            time.sleep(5)

def build_ffmpeg_command(input_url: str, output_url: str, is_live: bool) -> list:
    """Construit la commande FFmpeg optimisée."""
    if is_live:
        # Commande complètement différente pour les flux en direct
        return [
            "ffmpeg",
            "-hide_banner",
            "-loglevel", "warning",
            "-re",
            "-i", input_url,
            "-c", "copy",            # Copy all streams without re-encoding
            "-f", "rtsp",
            "-rtsp_transport", "tcp",
            output_url
        ]
    else:
        # Options pour vidéos normales (inchangé)
        return [
            "ffmpeg",
            "-hide_banner",
            "-loglevel", "error",
            "-fflags", "+genpts+discardcorrupt",
            "-analyzeduration", "10M",
            "-probesize", "10M",
            "-re",
            "-i", input_url,
            "-c:v", "copy",
            "-c:a", "copy",
            "-f", "rtsp",
            "-rtsp_transport", "tcp",
            "-muxdelay", "0.5",
            output_url
        ]

@app.get("/api/start")
async def start_processing(
    url: str = Query(..., description="URL YouTube (live ou vidéo normale"),
    notify_api2: bool = Query(True, description="Notifier automatiquement l'API 2")
):
    """Démarre ou met à jour le flux."""
    global restart_event, active_url
    
    # Validation de l'URL
    if not re.match(r"^(https?\:\/\/)?(www\.youtube\.com|youtu\.be)", url.lower()):
        raise HTTPException(status_code=400, detail="URL YouTube invalide")
    
    # 1. D'abord arrêter proprement les flux existants
    await stop_processing()
    
    # 2. Attendre que tout soit bien arrêté
    time.sleep(2)
    
    # 3. Démarrer le nouveau flux
    restart_event.clear()
    
    # Démarrer le nouveau flux dans un thread
    stream_thread = threading.Thread(
        target=manage_stream,
        args=(url,),
        daemon=True
    )
    stream_thread.start()
    
    # Déterminer l'URL RTSP en fonction du type de vidéo
    is_live = is_youtube_live(url)
    rtsp_url = RTSP_YOUTUBE_LIVE if is_live else RTSP_YOUTUBE_NORMAL
    active_url = url
    
    # Attendre que le flux soit établi (jusqu'à 10 secondes)
    if notify_api2:
        logger.info(f"Attente de l'établissement du flux RTSP avant notification de l'API 2...")
        for _ in range(10):
            # Vérifier si le processus est en cours d'exécution
            with process_lock:
                if current_process and current_process.poll() is None:
                    time.sleep(2)  # Attendre un peu plus pour s'assurer que le flux est stable
                    
                    # Notifier l'API 2 pour démarrer la conversion RTSP → HLS
                    try:
                        # D'abord nettoyer les anciens fichiers
                        cleanup_response = requests.get(
                            f"http://localhost:8020/api/clean",
                            timeout=5
                        )
                        logger.info(f"Nettoyage API 2: {cleanup_response.json()}")
                        
                        # Ensuite démarrer avec la nouvelle URL
                        api2_response = requests.get(
                            f"http://localhost:8020/api/start",
                            params={"rtsp_url": rtsp_url, "enable_ai": True},
                            timeout=5
                        )
                        logger.info(f"API 2 notifiée avec succès: {api2_response.json()}")
                    except Exception as e:
                        logger.error(f"Erreur lors de la notification de l'API 2: {str(e)}")
                        
            time.sleep(1)
    
    return JSONResponse({
        "status": "Traitement démarré/mis à jour",
        "url": url,
        "rtsp_stream": rtsp_url,
        "hls_streaming": "Conversion HLS démarrée automatiquement" if notify_api2 else "Non démarré"
    })

@app.get("/api/stop")
async def stop_processing():
    """Arrête complètement le flux et nettoie les fichiers."""
    global current_process, restart_event, active_url
    
    restart_event.set()
    with process_lock:
        if current_process:
            try:
                current_process.terminate()
                current_process.wait(timeout=5)
            except:
                try:
                    current_process.kill()
                except:
                    pass
            current_process = None
    active_url = None
    
    # Nettoyer les fichiers dans le dossier HLS et notifier l'API 2
    try:
        # Supprimer uniquement les fichiers dans tmp/hls_output
        if os.path.exists("tmp/hls_output"):
            for filename in os.listdir("tmp/hls_output"):
                file_path = os.path.join("tmp/hls_output", filename)
                try:
                    if os.path.isfile(file_path):
                        os.unlink(file_path)
                        logger.info(f"Fichier {filename} supprimé avec succès")
                except Exception as e:
                    logger.error(f"Erreur suppression fichier {filename}: {str(e)}")
            
        # Notifier l'API 2 pour arrêter et vérifier
        try:
            api2_response = requests.get(
                f"http://localhost:8020/api/stop",
                timeout=5
            )
            logger.info(f"Arrêt de l'API 2 notifié: {api2_response.json()}")
            
            # Demander à l'API 2 de vérifier le nettoyage
            verify_response = requests.get(
                f"http://localhost:8020/api/verify_cleanup",
                timeout=5
            )
            logger.info(f"Vérification API 2: {verify_response.json()}")
            
        except Exception as e:
            logger.error(f"Erreur lors de la notification à l'API 2: {str(e)}")
        
        return JSONResponse({
            "status": "Flux arrêté et fichiers supprimés",
            "details": {
                "api1": "Arrêté et fichiers supprimés",
                "api2": "Arrêt notifié et vérification effectuée"
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur nettoyage: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du nettoyage: {str(e)}")

@app.get("/api/status")
async def get_status():
    """Retourne le statut actuel."""
    is_active = False
    with process_lock:
        if current_process and current_process.poll() is None:
            is_active = True
    
    return JSONResponse({
        "active": is_active,
        "current_url": active_url,
        "is_live": is_youtube_live(active_url) if active_url else None
    })

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT, log_level="info")



@app.get("/api/debug")
async def debug_stream(url: str = Query(..., description="URL YouTube à vérifier")):
    """Fonction pour déboguer un flux YouTube."""
    try:
        is_live = is_youtube_live(url)
        
        # Tester la récupération de l'URL
        cmd = [
            "yt-dlp",
            "--no-warnings",
            "--cookies", "cookies.txt",  # ajouté ici
            "-g",
            "-F",
            url
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=20
        )
        
        formats = result.stdout.strip()
        errors = result.stderr.strip() if result.stderr else None
        
        return JSONResponse({
            "url": url,
            "is_live": is_live,
            "available_formats": formats,
            "errors": errors
        })
    except Exception as e:
        logger.error(f"Erreur debug: {str(e)}")
        return JSONResponse({
            "error": str(e)
        }, status_code=500)
    





## ./go2rtc -config go2rtc.yaml



