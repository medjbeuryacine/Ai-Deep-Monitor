import cv2
import subprocess
import threading
from fastapi import FastAPI
from pydantic import BaseModel
from ultralytics import YOLO
import torch

app = FastAPI()

# Charger les modèles (une seule fois au lancement)
model_obj = YOLO("yolov8n.pt")
model_face = YOLO("yolov8n-face.pt")

# Valeurs par défaut pour la caméra
RTSP_OUT = "rtsp://127.0.0.1:8556/detection"

# Pour éviter de relancer plusieurs fois
detection_thread = None
stop_event = threading.Event()

# Modèle pour récupérer les infos de la caméra
class CameraConfig(BaseModel):
    rtsp_url: str
    username: str
    password: str


def run_detection(rtsp_url: str):
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print("Error: Could not open video source")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Lancer FFmpeg
    ffmpeg_cmd = [
        'ffmpeg',
        '-y',  # overwrite output file without asking
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', f'{width}x{height}',
        '-r', str(int(cap.get(cv2.CAP_PROP_FPS))),  # input framerate
        '-i', '-',  # stdin
        '-c:v', 'libx264',  # ou 'h264_nvenc' si GPU
        '-preset', 'veryfast',
        '-tune', 'zerolatency',
        '-rtsp_transport', 'tcp',
        '-f', 'rtsp',
        RTSP_OUT
    ]
    
    try:
        ffmpeg_proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE)

        while not stop_event.is_set():
            ret, frame = cap.read()
            if not ret:
                print("Error: Failed to read frame")
                break

            # Détection objets + visages
            res_obj = model_obj(frame, conf=0.3, verbose=False)[0]
            res_face = model_face(frame, conf=0.3, verbose=False)[0]

            # Dessiner objets
            for box in res_obj.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                label = f"{model_obj.names[cls]}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

            # Dessiner visages
            for box in res_face.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
                cv2.putText(frame, "Face", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

            try:
                ffmpeg_proc.stdin.write(frame.tobytes())
            except BrokenPipeError:
                print("Error: FFmpeg pipe broken")
                break

    finally:
        cap.release()
        if ffmpeg_proc.poll() is None:
            ffmpeg_proc.stdin.close()
            ffmpeg_proc.wait()


@app.post("/start-detection")
def start_detection(config: CameraConfig):
    global detection_thread, stop_event
    
    if detection_thread and detection_thread.is_alive():
        return {"status": "already running"}
    
    stop_event.clear()
    rtsp_url = f"rtsp://{config.username}:{config.password}@{config.rtsp_url.split('rtsp://')[-1]}"

    # Démarrer la détection dans un thread
    detection_thread = threading.Thread(target=run_detection, args=(rtsp_url,), daemon=True)
    detection_thread.start()

    return {"status": "detection started", "rtsp": RTSP_OUT, "rtsp_camera": rtsp_url}


@app.post("/stop-detection")
def stop_detection():
    global stop_event
    stop_event.set()
    return {"status": "detection stopped"}



@app.get("/status")
def get_full_status():
    global detection_thread, stop_event
    
    status = {
        "detection": {
            "is_running": detection_thread is not None and detection_thread.is_alive(),
            "is_stopped": stop_event.is_set() if detection_thread else True,
            "output_stream": RTSP_OUT
        },
        "models_loaded": {
            "object_detection": model_obj is not None,
            "face_detection": model_face is not None
        },
        "system": {
            "gpu_available": torch.cuda.is_available() if hasattr(torch, 'cuda') else False
        }
    }
    
    return status

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8050)


## ./go2rtc -config go2rtc2.yaml
