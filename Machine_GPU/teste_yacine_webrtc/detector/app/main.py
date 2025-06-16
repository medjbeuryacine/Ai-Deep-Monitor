import io
import subprocess
import asyncio
import threading
import cv2
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from ultralytics import YOLO

app = FastAPI()

# CORS – autorise tout (à restreindre en prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration RTSP et états des modèles
rtsp_urls = {
    "cam1": "rtsp://root:demo1234@192.168.1.155/live1s1.sdp"
}
active = {
    cam: {"person": False, "face": False, "object": False}
    for cam in rtsp_urls
}


class Detector:
    def __init__(self, urls):
        self.urls = urls
        # Une VideoCapture par caméra
        self.caps = {
            cam: cv2.VideoCapture(url)
            for cam, url in urls.items()
        }
        # Verrou pour sérialiser l'accès à VideoCapture
        self.lock = threading.Lock()
        # Chargement des modèles
        self.models = {
            "person": YOLO("yolov8n.pt"),
            "face":   YOLO("/app/models/yolov8n-face-lindevs.pt"),
            "object": YOLO("yolov8x.pt"),
        }

    def reopen(self, cam_id: str):
        """Recrée le VideoCapture si la précédente a planté."""
        try:
            self.caps[cam_id].release()
        except:
            pass
        self.caps[cam_id] = cv2.VideoCapture(self.urls[cam_id])

    def read_frame(self, cam_id: str):
        """Lit une frame, reconnecte une fois si échec."""
        with self.lock:
            cap = self.caps[cam_id]
            ret, frame = cap.read()
            if not ret:
                self.reopen(cam_id)
                ret, frame = self.caps[cam_id].read()
                if not ret:
                    raise RuntimeError(f"Échec lecture frame {cam_id}")
            return frame

    def detect(self, cam_id: str, frame, flags: dict):
        """Applique chaque modèle activé sur la frame."""
        results = []
        for name, model in self.models.items():
            if flags.get(name):
                res = model(frame)[0]
                for box in res.boxes.data.tolist():
                    x1, y1, x2, y2, score, cls = box
                    label = res.names[int(cls)]
                    results.append({
                        "x1": x1, "y1": y1,
                        "x2": x2, "y2": y2,
                        "score": score, "label": label
                    })
        return results


# Instanciation du détecteur
detector = Detector(rtsp_urls)


@app.post("/toggle/{cam_id}/{model}")
def toggle_model(cam_id: str, model: str):
    """Active/désactive un modèle pour une caméra."""
    if cam_id in active and model in active[cam_id]:
        active[cam_id][model] = not active[cam_id][model]
        return {cam_id: active[cam_id]}
    raise HTTPException(404, "cam/model inconnu")


@app.get("/snapshot/{cam_id}")
async def snapshot(cam_id: str):
    """Retourne une image JPEG instantanée via ffmpeg."""
    if cam_id not in rtsp_urls:
        raise HTTPException(404, "Caméra inconnue")
    cmd = [
        "ffmpeg", "-rtsp_transport", "tcp",
        "-threads", "1",
        "-i", rtsp_urls[cam_id],
        "-frames:v", "1",
        "-f", "image2",
        "-loglevel", "error",
        "pipe:1"
    ]
    try:
        proc = subprocess.run(
            cmd, capture_output=True, timeout=5, check=True
        )
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "Timeout ffmpeg")
    except subprocess.CalledProcessError as e:
        raise HTTPException(502, f"ffmpeg error: {e.stderr.decode()}")
    return StreamingResponse(io.BytesIO(proc.stdout), media_type="image/jpeg")


@app.websocket("/ws/detections/{cam_id}")
async def ws_detections(ws: WebSocket, cam_id: str):
    """WebSocket qui envoie les boîtes de détection en continu."""
    await ws.accept()
    try:
        while True:
            # Lecture de la frame dans un thread
            try:
                frame = await run_in_threadpool(detector.read_frame, cam_id)
            except RuntimeError as e:
                print(f"[ws] read_frame failed: {e}")
                await asyncio.sleep(0.2)
                continue

            # Inférence dans un thread
            try:
                dets = await run_in_threadpool(
                    detector.detect, cam_id, frame, active[cam_id]
                )
            except Exception as e:
                print(f"[ws] detect failed: {e}")
                dets = []

            # Envoi des résultats JSON
            await ws.send_json({"cam_id": cam_id, "detections": dets})
            # Petit délai pour limiter la charge
            await asyncio.sleep(0.03)
    except WebSocketDisconnect:
        print(f"[ws] disconnected {cam_id}")
        return
