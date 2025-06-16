import cv2
import subprocess
import threading
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from ultralytics import YOLO
from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.media import MediaPlayer
from av import VideoFrame
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
from fastapi.exceptions import HTTPException

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permet d'accepter les requêtes depuis l'IP de la machine web
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes HTTP
    allow_headers=["*"],  # Autoriser tous les en-têtes
)

# Charger les modèles (une seule fois au lancement)
model_obj = YOLO("yolov8n.pt")
model_face = YOLO("yolov8n-face.pt")

# Valeurs par défaut
RTSP_OUT = "rtsp://localhost:8556/detection"
WEBRTC_CLIENTS = set()

# Pour éviter de relancer plusieurs fois
detection_thread = None
stop_event = threading.Event()

# Modèle pour récupérer les infos de la caméra
class CameraConfig(BaseModel):
    rtsp_url: str
    username: str
    password: str

class DetectionTrack(VideoStreamTrack):
    def __init__(self, rtsp_url):
        super().__init__()
        self.cap = cv2.VideoCapture(rtsp_url)
        if not self.cap.isOpened():
            raise Exception("Could not open video source")
        
        self.model_obj = YOLO("yolov8n.pt")
        self.model_face = YOLO("yolov8n-face.pt")
        self.stop_event = threading.Event()

    async def recv(self):
        pts, time_base = await self.next_timestamp()
        
        ret, frame = self.cap.read()
        if not ret:
            raise Exception("Failed to read frame")

        # Détection objets
        res_obj = self.model_obj(frame, conf=0.3, verbose=False)[0]
        for box in res_obj.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls = int(box.cls[0])
            label = f"{self.model_obj.names[cls]}"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        # Détection visages
        res_face = self.model_face(frame, conf=0.3, verbose=False)[0]
        for box in res_face.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(frame, "Face", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

        # Convertir en frame compatible WebRTC
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = VideoFrame.from_ndarray(frame, format="rgb24")
        frame.pts = pts
        frame.time_base = time_base
        
        return frame

    def stop(self):
        self.stop_event.set()
        self.cap.release()
        super().stop()

@app.post("/start-detection")
async def start_detection(config: CameraConfig):
    global detection_thread, stop_event
    
    if detection_thread and detection_thread.is_alive():
        return {"status": "already running"}
    
    stop_event.clear()
    
    # Construction de l'URL RTSP avec authentification
    rtsp_url = (
        f"rtsp://{config.username}:{config.password}@"
        f"{config.rtsp_url.split('rtsp://')[-1]}"
    )
    
    # Vérification de la connexion à la caméra
    test_cap = cv2.VideoCapture(rtsp_url)
    if not test_cap.isOpened() or not test_cap.read()[0]:
        test_cap.release()
        raise HTTPException(status_code=400, detail="Impossible de se connecter à la caméra")
    test_cap.release()

    # Démarrer le thread de détection
    detection_thread = threading.Thread(
        target=run_detection, 
        args=(rtsp_url,),
        daemon=True
    )
    detection_thread.start()

    return {
        "status": "detection started",
        "rtsp": RTSP_OUT,
        "webrtc_url": "ws://192.168.1.153:8050/ws/webrtc"
    }

@app.post("/stop-detection")
def stop_detection():
    global stop_event
    stop_event.set()
    return {"status": "detection stopped"}

from starlette.websockets import WebSocketState

@app.websocket("/ws/webrtc")
async def webrtc_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket client connected") 
    pc = RTCPeerConnection()

    try:
        # Recevoir la configuration de la caméra
        data = await websocket.receive_text()
        print(f"🔵 Données reçues: {data}")  # Debug
        
        config = json.loads(data)
        print(f"🔵 Configuration analysée: {config}")  # Debug
        
        rtsp_url = f"rtsp://{config['username']}:{config['password']}@{config['rtsp_url'].split('rtsp://')[-1]}"
        
        # Créer le track de détection
        track = DetectionTrack(rtsp_url)
        pc.addTrack(track)

        @pc.on("iceconnectionstatechange")
        async def on_iceconnectionstatechange():
            if pc.iceConnectionState == "failed":
                await pc.close()
                await websocket.close()

        # Négociation WebRTC
        offer = await websocket.receive_text()
        await pc.setRemoteDescription(RTCSessionDescription(**json.loads(offer)))
        
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        await websocket.send_text(json.dumps({
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        }))

        # Maintenir la connexion ouverte
        while True:
            await asyncio.sleep(1)
            if websocket.client_state == WebSocketState.DISCONNECTED:
                break

    except Exception as e:
        print(f"WebRTC error: {e}")
    finally:
        await pc.close()
        await websocket.close()

def run_detection(rtsp_url: str):
    cap = cv2.VideoCapture(rtsp_url)
    if not cap.isOpened():
        print("Error: Could not open video source")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    ffmpeg_cmd = [
        'ffmpeg',
        '-y',
        '-f', 'rawvideo',
        '-pix_fmt', 'bgr24',
        '-s', f'{width}x{height}',
        '-r', str(int(cap.get(cv2.CAP_PROP_FPS))),
        '-i', '-',
        '-c:v', 'libx264',
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

            res_obj = model_obj(frame, conf=0.3, verbose=False)[0]
            res_face = model_face(frame, conf=0.3, verbose=False)[0]

            for box in res_obj.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls = int(box.cls[0])
                label = f"{model_obj.names[cls]}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

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


@app.get("/status")
def get_status():
    """Retourne le statut actuel du système de détection"""
    status = {
        "detection_active": detection_thread is not None and detection_thread.is_alive(),
        "rtsp_output": RTSP_OUT,
        "webrtc_clients": len(WEBRTC_CLIENTS),
        "system_status": "running"
    }
    return status


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(
        app, 
        host='0.0.0.0',  # Écoute sur toutes les interfaces
        port=8050,
        ws='websockets',  # Force l'utilisation de la lib websockets
        reload=False,
        timeout_keep_alive=60
    )