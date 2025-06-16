import subprocess
import time

# 🔹 Configuration
RTSP_URL = "rtsp://192.168.1.153:8554/webcam"  # 📡 Serveur RTSP go2rtc
VIDEO_DEVICE = "/dev/video0"  # 🎥 Webcam (Linux)
RESOLUTION = "1280x720"  # 📏 Résolution MJPEG
FRAMERATE = "30"  # 🎞️ FPS

def start_mjpeg_rtsp(video_device, rtsp_url, resolution, framerate):
    """Diffuse la webcam MJPEG en RTSP via FFmpeg et go2rtc."""
    print(f"🎥 Diffusion MJPEG de {video_device} ({resolution} @ {framerate} FPS) vers {rtsp_url} via go2rtc...")

    command = [
        "ffmpeg", "-re",
        "-f", "v4l2", "-input_format", "mjpeg", "-framerate", framerate, "-video_size", resolution, "-i", video_device,
        "-c:v", "copy",  # 🔹 Aucune conversion, on garde MJPEG
        "-f", "rtsp", rtsp_url
    ]
    
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return process

# 🔹 Lancer la diffusion MJPEG
ffmpeg_process = start_mjpeg_rtsp(VIDEO_DEVICE, RTSP_URL, RESOLUTION, FRAMERATE)

# 🔹 Boucle pour garder le processus actif
try:
    while True:
        time.sleep(10)
except KeyboardInterrupt:
    print("\n🛑 Arrêt du flux RTSP...")
    ffmpeg_process.terminate()
