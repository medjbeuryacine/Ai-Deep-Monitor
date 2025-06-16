import cv2
import numpy as np
import subprocess
import os
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from typing import List
from ultralytics import YOLO

app = FastAPI(title="API de Détection sur Flux Vidéo")

# Charger le modèle YOLOv8 (ou remplacez par votre modèle custom)
model = YOLO("yolov8n.pt")

# Charger le classifieur Haar pour la détection des visages
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def get_youtube_stream(url: str, live: bool) -> str:
    """
    Récupère l'URL du flux vidéo pour une vidéo YouTube.
    - Pour un live (live=True) : retourne directement l'URL du flux HLS via yt-dlp.
    - Pour une vidéo non live (live=False) : télécharge la vidéo en 480p et retourne le fichier.
    """
    if live:
        result = subprocess.run(["yt-dlp", "-g", url], capture_output=True, text=True)
        stream_url = result.stdout.strip()
        if not stream_url:
            raise RuntimeError("❌ Impossible d'obtenir l'URL du flux YouTube (live)")
        return stream_url
    else:
        file = "youtube_video.mp4"
        # Supprime le fichier existant pour forcer le téléchargement
        if os.path.exists(file):
            os.remove(file)
        print("📥 Téléchargement de la vidéo YouTube en MP4 (480p)...")
        command = [
            "yt-dlp",
            "-f", "bestvideo[height<=480]+bestaudio/best[height<=480]",
            "--merge-output-format", "mp4",
            "-o", file,
            url
        ]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode != 0 or not os.path.exists(file):
            raise RuntimeError(
                "❌ Erreur lors du téléchargement de la vidéo YouTube (non live)\n"
                f"stderr: {result.stderr}"
            )
        print(f"✅ Téléchargement terminé : {file}")
        return file


def video_source(source: str, type_video: str) -> str:
    """
    Retourne la source vidéo à utiliser.
    Selon type_video :
      - "youtubelive" : retourne l'URL HLS (pour le live)
      - "youtubevideo" : télécharge la vidéo et retourne le fichier local
      - "mp4" : retourne directement la source (chemin ou URL)
    """
    if type_video == "youtubelive":
        return get_youtube_stream(source, live=True)
    elif type_video == "youtubevideo":
        return get_youtube_stream(source, live=False)
    else:
        return source


def detect_yolo(frame, detect_list: List[str]):
    """
    Applique le modèle YOLO sur la frame pour détecter les objets
    dont le libellé est présent dans detect_list ou si 'all' est spécifié.
    """
    results = model(frame, conf=0.4)[0]
    for box in results.boxes:
        cls_id = int(box.cls[0].item())
        label = model.model.names[cls_id] if hasattr(model, "model") and hasattr(model.model, "names") else model.names[cls_id]
        conf = float(box.conf[0].item())
        if "all" in detect_list or label.lower() in detect_list:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame


def detect_faces(frame):
    """
    Applique la détection de visages à l'aide du classifieur Haar.
    """
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
        cv2.putText(frame, "Face", (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
    return frame


def detect_objects(frame, detect_list: List[str]):
    """
    Applique la détection sur la frame :
      - Utilise YOLO pour "person", "phone", etc.
      - Utilise le classifieur Haar pour "face"
    """
    if any(t in detect_list for t in ["person", "phone", "all"]):
        frame = detect_yolo(frame, detect_list)
    if "face" in detect_list or "all" in detect_list:
        frame = detect_faces(frame)
    return frame


def generate_frames(source: str, targets: List[str], type_video: str):
    """
    Génère un flux MJPEG à partir de la source vidéo avec détection d'objets.
    - Pour un flux live (type_video == "youtubelive"), utilise FFmpeg pour lire le flux HLS.
    - Pour les autres types, utilise cv2.VideoCapture.
    """
    if type_video == "youtubelive":
        stream_url = get_youtube_stream(source, live=True)
        width, height = 854, 480  # Résolution forcée (modifiable)
        command = [
            "ffmpeg",
            "-i", stream_url,
            "-vf", "scale=854:480",
            "-f", "image2pipe",
            "-pix_fmt", "bgr24",
            "-vcodec", "rawvideo",
            "-"
        ]
        pipe = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        frame_size = width * height * 3
        while True:
            raw_frame = pipe.stdout.read(frame_size)
            if len(raw_frame) != frame_size:
                break
            frame = np.frombuffer(raw_frame, dtype=np.uint8).reshape((height, width, 3))
            frame = detect_objects(frame, targets)
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        pipe.stdout.close()
        pipe.wait()
    else:
        actual_source = video_source(source, type_video)
        cap = cv2.VideoCapture(actual_source)
        if not cap.isOpened():
            raise RuntimeError("Erreur ouverture vidéo – source : " + actual_source)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame = detect_objects(frame, targets)
            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        cap.release()


@app.get("/api/detect")
async def detect(
    source: str = Query(..., description="Source vidéo : URL RTSP, chemin MP4 ou lien YouTube"),
    type_video: str = Query("youtubelive", description="Type de flux : youtubelive, youtubevideo, mp4"),
    detect: str = Query("all", description="Cibles de détection (ex. person,face,phone ou all)")
):
    """
    Exemple d'appel :
      GET /api/detect?source=<source>&type_video=<type>&detect=person,face
      
    - Pour un live YouTube, utilisez type_video=youtubelive.
    - Pour une vidéo YouTube non live, utilisez type_video=youtubevideo.
    - Pour un fichier MP4 ou flux local, utilisez type_video=mp4.
    """
    targets = [d.strip().lower() for d in detect.split(",")]
    return StreamingResponse(
        generate_frames(source, targets, type_video),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
