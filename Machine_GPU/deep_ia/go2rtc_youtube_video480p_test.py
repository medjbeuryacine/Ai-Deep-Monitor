import subprocess
import time
import os
import json

# 🔹 CONFIGURATION
YOUTUBE_URL = "https://www.youtube.com/watch?v=5a9ozuMcMYY"
VIDEO_FILE = "video.mp4"
RTSP_URL = "rtsp://localhost:8554/youtube"

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

def get_video_duration(video_file):
    """Extrait la durée de la vidéo en secondes avec ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "json",
        video_file
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    metadata = json.loads(result.stdout)
    return float(metadata["format"]["duration"])

def start_rtsp_stream(video_file, rtsp_url):
    """Diffuse la vidéo en RTSP."""
    duration = get_video_duration(video_file)
    print(f"⏳ Durée de la vidéo : {duration:.2f} secondes")

    command = [
        "ffmpeg",
        "-re",
        "-i", video_file,
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-b:v", "800k",
        "-c:a", "aac",
        "-b:a", "128k",
        "-f", "rtsp",
        "-rtsp_transport", "tcp",
        rtsp_url
    ]
    
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return process

def is_vlc_running():
    """Vérifie si VLC est en cours d'exécution en utilisant subprocess."""
    try:
        if os.name == 'nt':  # Windows
            result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq vlc.exe'], 
                                   capture_output=True, text=True)
            return 'vlc.exe' in result.stdout
        else:  # Linux/Mac
            result = subprocess.run(['pgrep', '-x', 'vlc'], 
                                   capture_output=True, text=True)
            return result.stdout.strip() != ''
    except Exception as e:
        print(f"Erreur lors de la vérification du statut de VLC: {e}")
        return False

def start_vlc(rtsp_url):
    """Démarre VLC avec le flux RTSP."""
    print("🎬 Démarrage de VLC...")
    vlc_command = ["vlc", rtsp_url]
    vlc_process = subprocess.Popen(vlc_command)
    return vlc_process

# 🔹 Étape 1 : Télécharger la vidéo si elle n'existe pas
if not os.path.exists(VIDEO_FILE):
    success = download_youtube_video(YOUTUBE_URL, VIDEO_FILE)
    if not success:
        exit(1)

# 🔹 Étape 2 : Diffuser la vidéo en RTSP
ffmpeg_process = start_rtsp_stream(VIDEO_FILE, RTSP_URL)

# 🔹 Étape 3 : Démarrer VLC
vlc_process = start_vlc(RTSP_URL)

# 🔹 Boucle pour surveiller VLC
try:
    print("⏩ Flux RTSP démarré. Appuyez sur Ctrl+C pour arrêter...")
    # Attendre que VLC démarre
    time.sleep(2)
    
    # Surveiller si VLC est fermé
    while is_vlc_running():
        time.sleep(1)
    
    print("🛑 VLC fermé, arrêt du flux RTSP...")
    
except KeyboardInterrupt:
    print("\n🛑 Arrêt manuel du script...")
    
finally:
    # S'assurer que FFmpeg est bien arrêté
    if ffmpeg_process:
        ffmpeg_process.terminate()
        ffmpeg_process.wait()
    print("✅ Flux RTSP arrêté.")



