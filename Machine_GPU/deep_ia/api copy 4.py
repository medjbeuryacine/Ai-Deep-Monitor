import cv2
import numpy as np
import subprocess
import threading
from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from typing import List
from ultralytics import YOLO

app = FastAPI(title="API de Détection sur Flux Vidéo")

# 🔹 Charger le modèle YOLOv8 avec le GPU
model = YOLO("yolov8n.pt").to("cuda")

# 🔹 Classifieur Haar pour les visages
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def detect_yolo(frame, detect_list: List[str]):
    results = model(frame, conf=0.4)[0]
    for box in results.boxes:
        cls_id = int(box.cls[0].item())
        label = model.names[cls_id]
        conf = float(box.conf[0].item())
        if "all" in detect_list or label.lower() in detect_list:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame

def detect_faces(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
        cv2.putText(frame, "Face", (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
    return frame

def detect_objects(frame, detect_list: List[str]):
    if any(t in detect_list for t in ["person", "phone", "all"]):
        frame = detect_yolo(frame, detect_list)
    if "face" in detect_list or "all" in detect_list:
        frame = detect_faces(frame)
    return frame

def stream_to_rtsp(youtube_url, rtsp_output):
    result = subprocess.run(["yt-dlp", "-g", youtube_url], capture_output=True, text=True)
    stream_url = result.stdout.strip()
    if not stream_url:
        print("❌ Impossible d'obtenir l'URL du flux YouTube")
        return

    print(f"📡 Diffusion RTSP sur : {rtsp_output}")
    ffmpeg_command = [
        "ffmpeg", "-re", "-i", stream_url,
        "-vf", "fps=30,scale=854:480",
        "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "1000k",
        "-c:a", "aac", "-b:a", "128k",
        "-rtsp_transport", "tcp",
        "-f", "rtsp", rtsp_output
    ]
    subprocess.Popen(ffmpeg_command)

async def generate_frames(rtsp_url: str, targets: List[str]):
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        raise RuntimeError(f"Erreur ouverture vidéo – source : {rtsp_url}")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (640, 360))  # Plus petit = plus rapide
        frame = detect_objects(frame, targets)
        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 60])
        if not ret:
            continue
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    cap.release()

@app.get("/api/detect")
async def detect(
    source: str = Query(..., description="Lien YouTube"),
    detect: str = Query("all", description="Cibles de détection (ex. person,face,phone ou all)")
):
    targets = [d.strip().lower() for d in detect.split(",")]
    rtsp_url = "rtsp://192.168.1.153:8554/youtubelive"

    # 🔹 Lancer le flux FFmpeg si pas déjà actif
    threading.Thread(target=stream_to_rtsp, args=(source, rtsp_url), daemon=True).start()

    return StreamingResponse(
        generate_frames(rtsp_url, targets),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

if __name__ == '__main__':
    import uvicorn
    print("✅ Utilisation CUDA :", model.device)
    uvicorn.run(app, host='0.0.0.0', port=8000)
