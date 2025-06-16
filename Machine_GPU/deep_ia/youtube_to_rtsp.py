#!/usr/bin/env python3

import subprocess
import time

# 🔗 URL YouTube (modifie ici pour tester d'autres vidéos)
YOUTUBE_URL = "https://www.youtube.com/watch?v=5a9ozuMcMYY"

# 📥 Obtenir les URLs du flux vidéo uniquement (sans audio)
def get_stream_url(youtube_url):
    try:
        print("🔍 Détection du flux vidéo (H.264 480p)...")
        result = subprocess.run(
            ["yt-dlp", "-g", "-f", "bestvideo[height<=480][ext=mp4]", youtube_url],
            capture_output=True, text=True, check=True
        )
        video_url = result.stdout.strip()
        if not video_url:
            raise ValueError("⚠️ Impossible d'obtenir le flux vidéo.")
        return video_url
    except Exception as e:
        print(f"❌ Erreur lors de la récupération du flux : {e}")
        return None

# 🎥 Lancer la diffusion RTSP avec FFmpeg
def start_rtsp_stream(video_url):
    rtsp_url = "rtsp://0.0.0.0:8554/youtube-stream"

    ffmpeg_cmd = [
        "ffmpeg", "-re", "-hwaccel", "cuda", "-hwaccel_output_format", "cuda",
        "-i", video_url,  # Entrée vidéo (directement depuis YouTube)
        "-vf", "scale_cuda=854:480",  # Redimensionnement optimisé via CUDA
        "-c:v", "h264_nvenc", "-preset", "p1", "-tune", "ll",
        "-b:v", "4000k", "-maxrate", "6000k", "-bufsize", "8000k",
        "-rc", "vbr", "-cq", "18", "-g", "60", "-pix_fmt", "yuv420p",
        "-f", "rtsp", rtsp_url
    ]

    print(f"🔥 Diffusion RTSP ultra-fluide sur : {rtsp_url}")

    try:
        subprocess.run(ffmpeg_cmd)
    except KeyboardInterrupt:
        print("🛑 Arrêt manuel de la diffusion RTSP")
    except Exception as e:
        print(f"❌ Erreur FFmpeg : {e}")

if __name__ == "__main__":
    video_url = get_stream_url(YOUTUBE_URL)
    if video_url:
        start_rtsp_stream(video_url)
    else:
        print("❌ Échec de la récupération du flux vidéo.")
