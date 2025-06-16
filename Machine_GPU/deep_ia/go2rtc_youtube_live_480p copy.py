import subprocess
import time

print("rtsp://192.168.1.153:8554/youtube")

def get_youtube_stream(youtube_url):
    """Récupère l'URL HLS du live YouTube."""
    result = subprocess.run(["yt-dlp", "-g", youtube_url], capture_output=True, text=True)
    return result.stdout.strip()

def start_ffmpeg_stream(youtube_url):
    """Lance FFmpeg pour convertir le flux HLS en RTSP avec une résolution de 480p."""
    stream_url = get_youtube_stream(youtube_url)
    if not stream_url:
        print("❌ Impossible d'obtenir l'URL du flux YouTube")
        return None

    print(f"🎥 Diffusion de {stream_url} en 480p vers RTSP...")

    ffmpeg_command = [
        "ffmpeg", "-re", "-i", stream_url,
        "-vf", "scale=854:480",  # Convertir en 480p
        "-c:v", "libx264", "-preset", "veryfast", "-b:v", "800k",  # Codec vidéo optimisé
        "-c:a", "aac", "-b:a", "128k",  # Codec audio AAC
        "-f", "rtsp", "rtsp://192.168.1.153:8554/youtube"
    ]

    return subprocess.Popen(ffmpeg_command)

# 🔹 URL YouTube Live
youtube_url = "https://www.youtube.com/watch?v=Z-Nwo-ypKtM"

# 🔹 Lancer la conversion avec FFmpeg
ffmpeg_process = start_ffmpeg_stream(youtube_url)

# 🔹 Laisser FFmpeg tourner
try:
    while True:
        time.sleep(10)
except KeyboardInterrupt:
    print("Arrêt du flux RTSP...")
    ffmpeg_process.terminate()
