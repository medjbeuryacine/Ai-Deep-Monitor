import cv2
import numpy as np
import subprocess
import threading
import time
import asyncio
import re

from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse, StreamingResponse, HTMLResponse
from typing import List, Optional
from ultralytics import YOLO

import logging
logging.getLogger("ultralytics").setLevel(logging.ERROR)

# Imports pour WebRTC
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
import av
from fractions import Fraction

# Activez le débogage en mettant ce flag à True (puis mettez-le à False une fois le débogage terminé)
VERBOSE = True

def log(msg):
    if VERBOSE:
        print(msg)

app = FastAPI(title="YouTube to RTSP/HTTP with AI Detection")

# Modèles YOLO
model_general = YOLO("yolov8n.pt")
model_face = YOLO("yolov8n-face.pt")

# Configuration
ALLOWED_CLASSES = ["person", "phone"]  # Classes autorisées
RTSP_OUTPUT = "rtsp://localhost:8554/detection"  # Flux RTSP de sortie
HTTP_PORT = 8020  # Port HTTP pour le flux MJPEG

# Variables globales
ffmpeg_process = None
processing_enabled = False
current_frame = None
frame_lock = threading.Lock()
detect_list = ["all"]
quality = "hd"
loop_video = False
video_type = "unknown"  # 'live' ou 'normal'
current_url = None  # Pour stocker l'URL actuelle
url_change_event = threading.Event()  # Pour signaler un changement d'URL

##########################
# Fonctions de traitement
##########################
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
    """Récupère le flux YouTube avec yt-dlp, optimisé pour vidéos normales et livestreams."""
    global video_type
    try:
        video_type = "live" if is_youtube_live(youtube_url) else "normal"
        log(f"📊 Type de vidéo détecté: {video_type}")
        if video_type == "live":
            result = subprocess.run(
                ["yt-dlp", "-g", "-f", "best", youtube_url],
                capture_output=True,
                text=True,
                check=True
            )
        else:
            result = subprocess.run(
                ["yt-dlp", "-g", "-f", "bestvideo[ext=mp4]/best[ext=mp4]/best", youtube_url],
                capture_output=True,
                text=True,
                check=True
            )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        log(f"❌ Erreur yt-dlp: {e.stderr}")
        return None

def detect_objects(frame):
    """Applique les détections IA sur une frame."""
    global detect_list
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
    if "face" in detect_list or "all" in detect_list:
        results = model_face(frame, conf=0.5)[0]
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
            cv2.putText(frame, "Face", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
    return frame

def video_processing_loop():
    """Boucle principale de traitement vidéo."""
    global current_frame, processing_enabled, ffmpeg_process, quality, detect_list, loop_video, video_type, current_url
    resolution = "1280:720" if quality == "hd" else "854:480"
    bitrate = "2000k" if quality == "hd" else "800k"
    ffmpeg_command = [
        'ffmpeg',
        '-y',
        '-f', 'rawvideo',
        '-vcodec', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', resolution,
        '-r', '25',
        '-i', '-',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-b:v', bitrate,
        '-rtsp_transport', 'tcp',
        '-f', 'rtsp',
        RTSP_OUTPUT
    ]
    ffmpeg_process = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)
    while processing_enabled:
        if url_change_event.is_set():
            log(f"🔄 Changement d'URL détecté: {current_url}")
            url_change_event.clear()
        stream_url = get_youtube_stream(current_url)
        if not stream_url:
            log("❌ Impossible d'obtenir le flux YouTube")
            time.sleep(2)
            continue
        log(f"🎥 Traitement en cours - Type: {video_type} - URL: {current_url} - RTSP: {RTSP_OUTPUT}")
        cap = cv2.VideoCapture(stream_url)
        if not cap.isOpened():
            log("❌ Impossible d'ouvrir le flux vidéo")
            time.sleep(2)
            continue
        log("✅ Flux vidéo ouvert avec succès")
        frame_count = 0
        try:
            while processing_enabled and not url_change_event.is_set():
                ret, frame = cap.read()
                if not ret:
                    if video_type == "live":
                        log("⚠️ Problème avec le livestream, tentative de reconnexion...")
                        break
                    else:
                        if loop_video:
                            log("🔄 Fin de la vidéo, redémarrage...")
                            break
                        else:
                            log("🏁 Fin de la vidéo atteinte")
                            break
                    continue
                frame_count += 1
                if frame_count % 100 == 0:
                    log(f"📊 Traitement en cours: {frame_count} frames")
                processed_frame = detect_objects(frame) if detect_list else frame
                height, width = processed_frame.shape[:2]
                target_width = int(resolution.split(':')[0])
                target_height = int(resolution.split(':')[1])
                if width != target_width or height != target_height:
                    processed_frame = cv2.resize(processed_frame, (target_width, target_height))
                with frame_lock:
                    current_frame = processed_frame.copy()
                try:
                    ffmpeg_process.stdin.write(processed_frame.tobytes())
                except BrokenPipeError:
                    log("⚠️ Connexion RTSP interrompue, réinitialisation...")
                    try:
                        ffmpeg_process.terminate()
                    except Exception:
                        pass
                    ffmpeg_process = subprocess.Popen(ffmpeg_command, stdin=subprocess.PIPE)
                    break
                if video_type == "normal":
                    time.sleep(0.033)
        except Exception as e:
            log(f"❌ Erreur traitement vidéo: {str(e)}")
        finally:
            cap.release()
        if url_change_event.is_set():
            continue
        if processing_enabled:
            time.sleep(2)
    if ffmpeg_process:
        try:
            ffmpeg_process.stdin.close()
        except Exception:
            pass
        ffmpeg_process.terminate()
    log("🛑 Traitement vidéo terminé")

##########################
# Endpoints API classiques
##########################
@app.get("/api/start")
async def start_processing(
    url: str = Query(..., description="URL YouTube (live ou vidéo normale)"),
    detect: str = Query("all", description="Objets à détecter (person,face,phone,all)"),
    q: str = Query("hd", description="Qualité: hd ou low"),
    loop: bool = Query(False, description="Boucler la vidéo normale")
):
    global processing_enabled, detect_list, quality, loop_video, current_url, url_change_event
    valid_targets = {"person", "face", "phone", "all"}
    detect_list = [d.strip().lower() for d in detect.split(",") if d.strip().lower() in valid_targets]
    if not detect_list:
        detect_list = ["all"]
    quality = q if q in ["hd", "low"] else "hd"
    loop_video = loop
    if processing_enabled:
        current_url = url
        url_change_event.set()
        return JSONResponse({
            "status": "URL mise à jour",
            "url": url,
            "targets": detect_list,
            "quality": quality,
            "loop": loop_video,
            "rtsp_stream": RTSP_OUTPUT,
            "http_stream": f"http://localhost:{HTTP_PORT}/stream.mjpg",
            "view_url": f"http://localhost:{HTTP_PORT}/api/view"
        })
    current_url = url
    processing_enabled = True
    threading.Thread(target=video_processing_loop, daemon=True).start()
    return JSONResponse({
        "status": "Traitement démarré",
        "url": url,
        "targets": detect_list,
        "quality": quality,
        "loop": loop_video,
        "rtsp_stream": RTSP_OUTPUT,
        "http_stream": f"http://localhost:{HTTP_PORT}/stream.mjpg",
        "view_url": f"http://localhost:{HTTP_PORT}/api/view"
    })

@app.get("/api/stop")
async def stop_processing():
    global processing_enabled, ffmpeg_process
    if not processing_enabled:
        return JSONResponse(status_code=400, content={"error": "Aucun traitement en cours"})
    processing_enabled = False
    if ffmpeg_process:
        try:
            ffmpeg_process.stdin.close()
        except Exception:
            pass
        ffmpeg_process.terminate()
    return JSONResponse({"status": "Traitement arrêté"})

@app.get("/api/status")
async def get_status():
    global video_type, current_url
    return JSONResponse({
        "active": processing_enabled,
        "url": current_url,
        "detecting": detect_list,
        "quality": quality,
        "loop": loop_video,
        "video_type": video_type,
        "rtsp_stream": RTSP_OUTPUT,
        "http_stream": f"http://localhost:{HTTP_PORT}/stream.mjpg",
        "view_url": f"http://localhost:{HTTP_PORT}/api/view"
    })

@app.get("/stream.mjpg")
async def video_feed():
    async def generate():
        while True:
            with frame_lock:
                if current_frame is None:
                    await asyncio.sleep(0.1)
                    continue
                ret, buffer = cv2.imencode('.jpg', current_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                frame_data = buffer.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n")
            await asyncio.sleep(0.03)
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/view")
async def view_video():
    async def generate():
        while True:
            with frame_lock:
                if current_frame is None:
                    await asyncio.sleep(0.1)
                    continue
                ret, buffer = cv2.imencode('.jpg', current_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
                frame_data = buffer.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n")
            await asyncio.sleep(0.03)
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")

##########################
# Endpoints WebRTC
##########################
class WebRTCMediaStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        self.counter = 0
    async def recv(self):
        await asyncio.sleep(0.033)
        with frame_lock:
            frame = current_frame.copy() if current_frame is not None else np.zeros((720, 1280, 3), dtype=np.uint8)
        video_frame = av.VideoFrame.from_ndarray(frame, format="bgr24")
        now = time.time()
        video_frame.pts = int(now * 90000)
        video_frame.time_base = Fraction(1, 90000)
        self.counter += 1
        return video_frame

@app.post("/api/webrtc")
async def webrtc_offer(request: Request):
    try:
        params = await request.json()
        offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])
        pc = RTCPeerConnection()
        video_track = WebRTCMediaStreamTrack()
        pc.addTrack(video_track)
        @pc.on("iceconnectionstatechange")
        async def on_ice_state_change():
            log(f"ICE Connection State: {pc.iceConnectionState}")
            if pc.iceConnectionState == "failed":
                await pc.close()
        await pc.setRemoteDescription(offer)
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sdp = pc.localDescription.sdp
        if "None" in sdp:
            log("SDP contient 'None', nettoyage...")
            sdp = "\n".join([line for line in sdp.splitlines() if "None" not in line])
        log("Local SDP renvoyé:\n" + sdp)
        return JSONResponse({
            "sdp": sdp,
            "type": pc.localDescription.type
        })
    except Exception as e:
        log("Erreur dans /api/webrtc: " + str(e))
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/webrtc_view")
async def webrtc_view():
    content = """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Flux WebRTC</title>
      </head>
      <body>
        <h2>Visionnage du flux WebRTC</h2>
        <video id="video" autoplay playsinline controls style="width: 640px; height: 360px;"></video>
        <script>
          const pc = new RTCPeerConnection();
          pc.ontrack = (event) => {
            document.getElementById('video').srcObject = event.streams[0];
          };
          async function negotiate() {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const response = await fetch('/api/webrtc', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sdp: pc.localDescription.sdp,
                type: pc.localDescription.type
              })
            });
            const answer = await response.json();
            await pc.setRemoteDescription(answer);
          }
          negotiate();
        </script>
      </body>
    </html>
    """
    return HTMLResponse(content=content)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT)
