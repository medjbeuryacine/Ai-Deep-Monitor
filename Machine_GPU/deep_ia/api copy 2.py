import cv2
import numpy as np
import subprocess
import os
import threading
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
from typing import List
from ultralytics import YOLO

app = FastAPI(title="API de Détection sur Flux Vidéo")

model = YOLO("yolov8n.pt")
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def detect_yolo(frame, detect_list: List[str]):
    results = model(frame, conf=0.4)[0]
    for box in results.boxes:
        cls_id = int(box.cls[0].item())
        label = model.model.names[cls_id] if hasattr(model, "model") and hasattr(model.model, "names") else model.names[cls_id]
        conf = float(box.conf[0].item())
        if "all" in detect_list or label.lower() in detect_list:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame

def detect_faces(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5)
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
        cv2.putText(frame, "Face", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
    return frame

def detect_objects(frame, detect_list: List[str]):
    if any(t in detect_list for t in ["person", "phone", "all"]):
        frame = detect_yolo(frame, detect_list)
    if "face" in detect_list or "all" in detect_list:
        frame = detect_faces(frame)
    return frame

def get_youtube_stream(youtube_url):
    result = subprocess.run(["yt-dlp", "-g", youtube_url], capture_output=True, text=True)
    return result.stdout.strip()

def stream_to_rtsp(source: str, targets: List[str]):
    stream_url = get_youtube_stream(source)
    if not stream_url:
        print("❌ Impossible d'obtenir l'URL du flux YouTube")
        return

    print(f"📡 Lecture du flux depuis : {stream_url}")

    ffmpeg_input = [
        "ffmpeg", "-i", stream_url,
        "-vf", "scale=854:480",
        "-f", "image2pipe",
        "-pix_fmt", "bgr24",
        "-vcodec", "rawvideo",
        "-an", "-sn", "-dn",
        "-"
    ]

    ffmpeg_output = [
        "ffmpeg", "-re", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "854x480", "-i", "-",
        "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "1000k", "-r", "30",
        "-f", "rtsp", "-rtsp_transport", "tcp", "rtsp://192.168.1.153:8554/detection"
    ]

    pipe_in = subprocess.Popen(ffmpeg_input, stdout=subprocess.PIPE)
    pipe_out = subprocess.Popen(ffmpeg_output, stdin=subprocess.PIPE)

    width, height = 854, 480
    frame_size = width * height * 3

    while True:
        raw_frame = pipe_in.stdout.read(frame_size)
        if len(raw_frame) != frame_size:
            break

        frame = np.frombuffer(raw_frame, dtype=np.uint8).reshape((height, width, 3)).copy()
        frame = detect_objects(frame, targets)

        pipe_out.stdin.write(frame.tobytes())

    pipe_in.stdout.close()
    pipe_in.wait()
    pipe_out.stdin.close()
    pipe_out.wait()

@app.get("/api/detect")
async def detect(
    source: str = Query(..., description="Lien YouTube"),
    detect: str = Query("all", description="person,face,phone ou all")
):
    targets = [d.strip().lower() for d in detect.split(",")]
    thread = threading.Thread(target=stream_to_rtsp, args=(source, targets))
    thread.start()

    return JSONResponse({
        "message": "🚀 Détection en cours",
        "stream": "rtsp://192.168.1.153:8554/detection"
    })

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
