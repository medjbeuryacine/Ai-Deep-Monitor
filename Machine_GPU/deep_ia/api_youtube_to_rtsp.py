# import cv2
# import subprocess
# import threading
# import time
# from fastapi import FastAPI, Query, HTTPException
# from fastapi.responses import JSONResponse
# import logging

# app = FastAPI(title="YouTube to RTSP Converter")

# # Configuration
# RTSP_PORT = 8554
# GPU_IP = "192.168.1.153"

# # Variables globales
# processing_enabled = False
# current_url = None
# ffmpeg_process = None

# def is_youtube_live(youtube_url):
#     """Vérifie si l'URL est un live YouTube."""
#     try:
#         result = subprocess.run(
#             ["yt-dlp", "--skip-download", "--print", "is_live", youtube_url],
#             capture_output=True,
#             text=True,
#             check=True
#         )
#         return result.stdout.strip() == "True"
#     except subprocess.CalledProcessError:
#         return False

# def get_youtube_stream(youtube_url):
#     """Récupère le flux YouTube avec yt-dlp."""
#     try:
#         is_live = is_youtube_live(youtube_url)
#         format_spec = "best" if is_live else "bestvideo[ext=mp4]/best[ext=mp4]/best"
        
#         result = subprocess.run(
#             ["yt-dlp", "-g", "-f", format_spec, youtube_url],
#             capture_output=True, 
#             text=True,
#             check=True
#         )
#         return result.stdout.strip(), is_live
#     except subprocess.CalledProcessError as e:
#         logging.error(f"Erreur yt-dlp: {e.stderr}")
#         return None, False

# def start_rtsp_stream(stream_url):
#     """Démarre le flux RTSP avec FFmpeg."""
#     global ffmpeg_process
    
#     rtsp_url = f"rtsp://{GPU_IP}:{RTSP_PORT}/youtube"
    
#     cmd = [
#         'ffmpeg',
#         '-i', stream_url,
#         '-c:v', 'copy',
#         '-f', 'rtsp',
#         rtsp_url
#     ]
    
#     ffmpeg_process = subprocess.Popen(
#         cmd,
#         stdout=subprocess.PIPE,
#         stderr=subprocess.PIPE,
#         universal_newlines=False
#     )
    
#     logging.info(f"Flux RTSP démarré: {rtsp_url}")

# def stop_rtsp_stream():
#     """Arrête le flux RTSP."""
#     global ffmpeg_process
    
#     if ffmpeg_process:
#         try:
#             ffmpeg_process.terminate()
#             ffmpeg_process.wait(timeout=5)
#         except:
#             ffmpeg_process.kill()
#         finally:
#             ffmpeg_process = None
#             logging.info("Flux RTSP arrêté")

# def youtube_streaming_loop():
#     """Boucle principale de streaming YouTube vers RTSP."""
#     global processing_enabled, current_url
    
#     while processing_enabled:
#         stream_url, is_live = get_youtube_stream(current_url)
#         if not stream_url:
#             logging.error("Impossible d'obtenir le flux YouTube")
#             time.sleep(2)
#             continue
        
#         logging.info(f"Démarrage du flux RTSP pour: {current_url}")
#         start_rtsp_stream(stream_url)
        
#         try:
#             while processing_enabled:
#                 # Vérifier si le processus FFmpeg est toujours en cours
#                 if ffmpeg_process and ffmpeg_process.poll() is not None:
#                     logging.warning("FFmpeg s'est arrêté, redémarrage...")
#                     break
                
#                 time.sleep(1)
                
#         except Exception as e:
#             logging.error(f"Erreur streaming: {str(e)}")
#         finally:
#             stop_rtsp_stream()
            
#         if processing_enabled:
#             time.sleep(2)

# @app.get("/api/start")
# async def start_processing(
#     url: str = Query(..., description="URL YouTube")
# ):
#     """Démarre le traitement vidéo."""
#     global processing_enabled, current_url
    
#     if processing_enabled:
#         current_url = url
#         return JSONResponse({"status": "URL mise à jour", "url": url})
    
#     current_url = url
#     processing_enabled = True
#     threading.Thread(
#         target=youtube_streaming_loop,
#         daemon=True
#     ).start()

#     return JSONResponse({
#         "status": "Traitement démarré",
#         "url": url,
#         "rtsp_stream": f"rtsp://{GPU_IP}:{RTSP_PORT}/youtube"
#     })

# @app.get("/api/stop")
# async def stop_processing():
#     """Arrête le traitement vidéo."""
#     global processing_enabled
    
#     if not processing_enabled:
#         raise HTTPException(status_code=400, detail="Aucun traitement en cours")
    
#     processing_enabled = False
#     stop_rtsp_stream()
    
#     return JSONResponse({"status": "Traitement arrêté"})

# @app.get("/api/status")
# async def get_status():
#     return JSONResponse({
#         "active": processing_enabled,
#         "rtsp_url": f"rtsp://{GPU_IP}:{RTSP_PORT}/youtube"
#     })

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8022)





from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
import yaml
import os
import subprocess
import re
import requests

app = FastAPI(title="YouTube to RTSP API", description="API pour convertir des flux YouTube en RTSP")

# Configuration
GO2RTC_CONFIG_PATH = "go2rtc.yaml"
GO2RTC_API_URL = "http://192.168.1.153:1984/api/stream"
RTSP_BASE_URL = "rtsp://192.168.1.153:8554"

class YouTubeRequest(BaseModel):
    url: HttpUrl
    stream_name: str = "youtube"  # Nom du flux par défaut

class RTSPResponse(BaseModel):
    rtsp_url: str
    stream_name: str
    youtube_url: str
    status: str

def validate_youtube_url(url: str) -> bool:
    """Vérifie si l'URL est une URL YouTube valide"""
    youtube_pattern = r"^(https?://)?(www\.)?(youtube\.com|youtu\.be)/.+$"
    return bool(re.match(youtube_pattern, str(url)))

def update_go2rtc_config(stream_name: str, youtube_url: str):
    """Mettre à jour la configuration go2rtc avec le nouveau flux"""
    try:
        # Lire la configuration existante
        with open(GO2RTC_CONFIG_PATH, 'r') as file:
            config = yaml.safe_load(file)
        
        # Ajouter ou mettre à jour le flux
        if 'streams' not in config:
            config['streams'] = {}
        
        # Configurer le flux YouTube avec ffmpeg
        config['streams'][stream_name] = f"youtube:{youtube_url}"
        
        # Enregistrer la configuration mise à jour
        with open(GO2RTC_CONFIG_PATH, 'w') as file:
            yaml.dump(config, file)
            
        return True
    except Exception as e:
        print(f"Error updating config: {e}")
        return False

def reload_go2rtc():
    """Recharger le service go2rtc pour appliquer la nouvelle configuration"""
    try:
        # Option 1: Utiliser l'API go2rtc pour recharger la configuration
        response = requests.post(f"{GO2RTC_API_URL}/reload")
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to reload go2rtc: {e}")
        # Option 2: Redémarrer le service (si l'option 1 échoue)
        try:
            subprocess.run(["systemctl", "restart", "go2rtc"], check=True)
            return True
        except:
            return False

@app.post("/youtube-to-rtsp", response_model=RTSPResponse)
async def convert_youtube_to_rtsp(request: YouTubeRequest, background_tasks: BackgroundTasks):
    """
    Convertit une URL YouTube en flux RTSP.
    
    - **url**: URL YouTube (live ou vidéo normale)
    - **stream_name**: Nom du flux (optionnel, par défaut: "youtube")
    
    Retourne l'URL RTSP générée.
    """
    if not validate_youtube_url(request.url):
        raise HTTPException(status_code=400, detail="URL YouTube invalide")
    
    # Mettre à jour la configuration
    success = update_go2rtc_config(request.stream_name, str(request.url))
    if not success:
        raise HTTPException(status_code=500, detail="Échec de la mise à jour de la configuration")
    
    # Recharger go2rtc en arrière-plan
    background_tasks.add_task(reload_go2rtc)
    
    # Générer l'URL RTSP
    rtsp_url = f"{RTSP_BASE_URL}/{request.stream_name}"
    
    return RTSPResponse(
        rtsp_url=rtsp_url,
        stream_name=request.stream_name,
        youtube_url=str(request.url),
        status="Le flux RTSP est en cours de génération. Il sera disponible dans quelques secondes."
    )

@app.get("/streams", response_model=dict)
async def get_streams():
    """Obtenir la liste des flux configurés"""
    try:
        with open(GO2RTC_CONFIG_PATH, 'r') as file:
            config = yaml.safe_load(file)
        
        streams = config.get('streams', {})
        result = {}
        
        for name, source in streams.items():
            if isinstance(source, str):
                result[name] = {
                    "source": source,
                    "rtsp_url": f"{RTSP_BASE_URL}/{name}"
                }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la lecture de la configuration: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8050)