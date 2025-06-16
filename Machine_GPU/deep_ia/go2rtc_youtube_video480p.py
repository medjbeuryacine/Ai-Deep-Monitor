import subprocess
import time
import os

# 🔹 CONFIGURATION
YOUTUBE_URL = "https://www.youtube.com/watch?v=5a9ozuMcMYY"  # 🔄 Remplace par l'URL YouTube
VIDEO_FILE = "video.mp4"  # 📥 Fichier MP4 local
RTSP_URL = "rtsp://localhost:8554/youtube"  # 📡 URL du RTSP Go2RTC

def download_youtube_video(youtube_url, output_file):
    """Télécharge la vidéo YouTube en 480p MP4."""
    print("📥 Téléchargement de la vidéo YouTube en MP4 (480p)...")

    command = [
        "yt-dlp", "-f", "bestvideo[ext=mp4][height<=480]+bestaudio[ext=m4a]/best[ext=mp4][height<=480]",
        "--merge-output-format", "mp4",
        "-o", output_file, youtube_url
    ]
    
    result = subprocess.run(command, capture_output=True, text=True)
    
    if result.returncode == 0:
        print(f"✅ Téléchargement terminé : {output_file}")
        return True
    else:
        print("❌ Erreur lors du téléchargement :")
        print(result.stderr)
        return False

def start_rtsp_stream(video_file, rtsp_url):
    """Diffuse la vidéo MP4 en RTSP via FFMPEG."""
    print(f"🎥 Diffusion de {video_file} vers {rtsp_url}...")

    command = [
        "ffmpeg", "-re", "-i", video_file,
        "-c:v", "libx264", "-preset", "ultrafast", "-b:v", "800k",
        "-c:a", "aac", "-b:a", "128k",
        "-f", "rtsp", rtsp_url
    ]
    
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return process

# 🔹 Étape 1 : Télécharger la vidéo si elle n'existe pas
if not os.path.exists(VIDEO_FILE):
    success = download_youtube_video(YOUTUBE_URL, VIDEO_FILE)
    if not success:
        exit(1)  # 🔴 Arrête si échec du téléchargement

# 🔹 Étape 2 : Diffuser la vidéo en RTSP
ffmpeg_process = start_rtsp_stream(VIDEO_FILE, RTSP_URL)

# 🔹 Boucle pour laisser tourner le processus
try:
    while True:
        time.sleep(10)
except KeyboardInterrupt:
    print("\n🛑 Arrêt du flux RTSP...")
    ffmpeg_process.terminate()
