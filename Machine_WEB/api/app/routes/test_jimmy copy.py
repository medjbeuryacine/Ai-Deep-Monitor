import subprocess
import cv2
import numpy as np
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter(tags=["Flux RTSP via FFmpeg"])

# 🔗 URL du flux RTSP émis depuis l'autre machine (YouTube → RTSP)
RTSP_URL = "rtsp://192.168.1.153:8554/detection"
#RTSP_URL = "rtsp://192.168.1.153:8554/youtubelive"

def gen_frames_ffmpeg():
    # 📡 Lancer FFmpeg avec transport RTSP en TCP
    command = [
        'ffmpeg',
        '-rtsp_transport', 'tcp',
        '-i', RTSP_URL,
        '-f', 'image2pipe',
        '-pix_fmt', 'bgr24',
        '-vcodec', 'rawvideo',
        '-'
    ]

    pipe = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=10**8)

    width, height = 854, 480  # Résolution du flux (doit matcher celle du RTSP)
    frame_size = width * height * 3

    while True:
        raw_frame = pipe.stdout.read(frame_size)
        if len(raw_frame) != frame_size:
            break

        frame = np.frombuffer(raw_frame, dtype=np.uint8).reshape((height, width, 3))
        success, buffer = cv2.imencode('.jpg', frame)
        if not success:
            continue

        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n'
        )

@router.get("/api/video-jimmy")
async def video_feed():
    """
    Stream le flux RTSP en direct (MJPEG) depuis une autre machine.
    """
    return StreamingResponse(gen_frames_ffmpeg(), media_type="multipart/x-mixed-replace; boundary=frame")
