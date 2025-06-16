import cv2
import numpy as np
import subprocess
import threading
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List
from ultralytics import YOLO

app = FastAPI(title="API Détection avec sortie HTTP & RTSP")

model_general = YOLO("yolov8n.pt")
model_face = YOLO("yolov8n-face.pt")

SOURCE_RTSP = "rtsp://127.0.0.1:8554/youtubelive"

ffmpeg_process = None


def detect_yolo(frame, detect_list: List[str]):
    results = model_general(frame, conf=0.4)[0]
    for box in results.boxes:
        cls_id = int(box.cls[0].item())
        label = model_general.model.names[cls_id]
        conf = float(box.conf[0].item())
        if "all" in detect_list or label.lower() in detect_list:
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return frame


def detect_yoloface(frame):
    results = model_face(frame, conf=0.5)[0]
    for box in results.boxes:
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
        cv2.putText(frame, "Face", (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
    return frame


def detect_objects(frame, detect_list: List[str]):
    if any(t in detect_list for t in ["person", "phone", "all"]):
        frame = detect_yolo(frame, detect_list)
    if "face" in detect_list or "all" in detect_list:
        frame = detect_yoloface(frame)
    return frame


def stream_to_rtsp(youtube_url):
    global ffmpeg_process
    if ffmpeg_process and ffmpeg_process.poll() is None:
        ffmpeg_process.terminate()
        ffmpeg_process.wait()

    result = subprocess.run(["yt-dlp", "-g", youtube_url], capture_output=True, text=True)
    stream_url = result.stdout.strip()
    if not stream_url:
        print("❌ Impossible d'obtenir le flux vidéo YouTube")
        return

    print(f"🎥 Streaming {stream_url} to {SOURCE_RTSP}")

    ffmpeg_command = [
        "ffmpeg", "-re", "-i", stream_url,
        "-vf", "scale=854:480",
        "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "800k",
        "-an", "-f", "rtsp", SOURCE_RTSP
    ]
    ffmpeg_process = subprocess.Popen(ffmpeg_command)


@app.get("/api/detect")
async def detect(
    source: str = Query(..., description="Lien YouTube"),
    detect: str = Query("all", description="Targets (person, face, all)")
):
    targets = [d.strip().lower() for d in detect.split(",")]
    threading.Thread(target=stream_to_rtsp, args=(source,), daemon=True).start()

    return JSONResponse({
        "status": "✅ Stream lancé. Accède au flux annoté sur /api/view",
        "rtsp_source": SOURCE_RTSP,
        "http_view": "/api/view"
    })


@app.get("/api/view")
def view_detection():
    def gen():
        cap = cv2.VideoCapture(SOURCE_RTSP)
        if not cap.isOpened():
            print("❌ Impossible d'ouvrir le flux pour affichage HTTP")
            return

        while True:
            ret, frame = cap.read()
            if not ret:
                continue
            frame = cv2.resize(frame, (640, 360))
            frame = detect_objects(frame, ["all"])
            _, buffer = cv2.imencode('.jpg', frame)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=frame")


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)