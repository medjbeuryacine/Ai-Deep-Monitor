# from fastapi import APIRouter, HTTPException, UploadFile, File, BackgroundTasks
# from fastapi.responses import FileResponse, JSONResponse
# from typing import List, Dict, Optional
# from pydantic import BaseModel
# import os
# import json
# import shutil
# import uuid
# import subprocess
# import logging
# import time
# import signal

# router = APIRouter(tags=["Video Stream API"])


# # Constantes pour les chemins de fichiers
# DATA_FILE = "streams/streams.json"
# VIDEOS_DIR = "videos"
# HLS_OUTPUT_DIR = "hls_streams"

# # Assurez-vous que les répertoires nécessaires existent
# os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
# os.makedirs(VIDEOS_DIR, exist_ok=True)
# os.makedirs(HLS_OUTPUT_DIR, exist_ok=True)

# # Configuration du logging
# logging.basicConfig(
#     level=logging.INFO,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger("stream_api")

# # Dictionnaire pour garder une trace des processus FFmpeg en cours
# active_conversions = {}

# # Modèles de données
# class StreamBase(BaseModel):
#     name: str
#     url: str
#     description: str
#     isActive: bool = True
#     type: str  # Type de média (mp4, youtube, rtsp, etc.)
#     isLive: bool = False  # Nouveau champ pour indiquer si c'est un live YouTube

# class StreamCreate(StreamBase):
#     pass

# class Stream(StreamBase):
#     id: int
#     hls_url: Optional[str] = None  # URL du stream HLS si disponible

# class ConversionOptions(BaseModel):
#     resolution: str = "640x480"  # Résolution par défaut
#     bitrate: str = "800k"       # Bitrate par défaut
#     segment_time: int = 4       # Durée des segments en secondes

# # Fonctions utilitaires
# def read_streams():
#     if not os.path.exists(DATA_FILE):
#         with open(DATA_FILE, 'w') as f:
#             json.dump([], f)
#         return []
   
#     with open(DATA_FILE, 'r') as f:
#         try:
#             return json.load(f)
#         except json.JSONDecodeError:
#             return []

# def write_streams(streams):
#     with open(DATA_FILE, 'w') as f:
#         json.dump(streams, f, indent=2)

# def get_next_id(streams):
#     if not streams:
#         return 1
#     return max(stream["id"] for stream in streams) + 1

# def stop_conversion(stream_id: int):
#     """Arrête le processus de conversion s'il est en cours."""
#     if stream_id in active_conversions:
#         process = active_conversions[stream_id]
#         try:
#             # Envoi du signal SIGTERM pour arrêter proprement le processus
#             os.killpg(os.getpgid(process.pid), signal.SIGTERM)
#             logger.info(f"Processus FFmpeg pour stream_id {stream_id} arrêté.")
#         except Exception as e:
#             logger.error(f"Erreur lors de l'arrêt du processus: {e}")
#         finally:
#             del active_conversions[stream_id]

# # Routes API originales
# @router.get("/api/streams", response_model=List[Stream])
# async def get_streams():
#     return read_streams()

# @router.get("/api/streams/{stream_id}", response_model=Stream)
# async def get_stream(stream_id: int):
#     streams = read_streams()
#     for stream in streams:
#         if stream["id"] == stream_id:
#             return stream
#     raise HTTPException(status_code=404, detail="Stream not found")

# @router.post("/api/streams", response_model=Stream)
# async def create_stream(stream: StreamCreate):
#     streams = read_streams()
#     new_stream = stream.dict()
#     new_stream["id"] = get_next_id(streams)
#     new_stream["hls_url"] = None  # Initialiser la propriété hls_url
#     streams.append(new_stream)
#     write_streams(streams)
#     return new_stream

# @router.put("/api/streams/{stream_id}", response_model=Stream)
# async def update_stream(stream_id: int, stream: StreamCreate):
#     streams = read_streams()
#     for i, existing_stream in enumerate(streams):
#         if existing_stream["id"] == stream_id:
#             updated_stream = stream.dict()
#             updated_stream["id"] = stream_id
#             # Conserver l'URL HLS si elle existe
#             if "hls_url" in existing_stream:
#                 updated_stream["hls_url"] = existing_stream["hls_url"]
#             else:
#                 updated_stream["hls_url"] = None
#             streams[i] = updated_stream
#             write_streams(streams)
#             return updated_stream
#     raise HTTPException(status_code=404, detail="Stream not found")

# @router.delete("/api/streams/{stream_id}")
# async def delete_stream(stream_id: int):
#     # Arrêter la conversion si elle est en cours
#     stop_conversion(stream_id)
    
#     streams = read_streams()
#     for i, existing_stream in enumerate(streams):
#         if existing_stream["id"] == stream_id:
#             url = existing_stream["url"]
#             if url.startswith("/api/videos/"):
#                 video_filename = url.split("/")[-1]
#                 video_path = os.path.join(VIDEOS_DIR, video_filename)
#                 if os.path.exists(video_path):
#                     os.remove(video_path)
            
#             # Supprimer les fichiers HLS si existants
#             hls_path = os.path.join(HLS_OUTPUT_DIR, f"stream_{stream_id}")
#             if os.path.exists(hls_path):
#                 shutil.rmtree(hls_path)

#             del streams[i]
#             write_streams(streams)
#             return {"message": "Stream deleted successfully"}
   
#     raise HTTPException(status_code=404, detail="Stream not found")

# # Routes de gestion des vidéos
# @router.post("/api/upload-video")
# async def upload_video(file: UploadFile = File(...)):
#     if not file.content_type.startswith("video/"):
#         raise HTTPException(status_code=400, detail="Only video files are allowed")
   
#     # Conserver le nom original du fichier (sécurisé)
#     original_filename = file.filename
#     safe_filename = "".join(c for c in original_filename if c.isalnum() or c in (' ', '.', '-', '_')).rstrip()
   
#     # Ajouter un UUID pour éviter les collisions
#     unique_id = uuid.uuid4().hex
#     file_extension = os.path.splitext(safe_filename)[1]
#     stored_filename = f"{unique_id}_{safe_filename}"
#     file_path = os.path.join(VIDEOS_DIR, stored_filename)
   
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
   
#     return {
#         "url": f"/api/videos/{stored_filename}",
#         "type": file.content_type.split("/")[1],
#         "original_filename": original_filename  # Ajout du nom original
#     }

# @router.get("/api/videos")
# async def list_videos():
#     videos = []
#     for file in os.listdir(VIDEOS_DIR):
#         if os.path.isfile(os.path.join(VIDEOS_DIR, file)):
#             videos.append({
#                 "filename": file,
#                 "url": f"/api/videos/{file}"
#             })
#     return videos

# @router.get("/api/videos/{filename}")
# async def get_video(filename: str):
#     file_path = os.path.join(VIDEOS_DIR, filename)
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="Video not found")
   
#     return FileResponse(file_path)

# # Nouvelle fonction pour démarrer la conversion RTSP en HLS
# def start_rtsp_conversion(stream_id: int, rtsp_url: str, options: Dict):
#     hls_output_path = os.path.join(HLS_OUTPUT_DIR, f"stream_{stream_id}")
#     os.makedirs(hls_output_path, exist_ok=True)
    
#     # Paramètres de la conversion
#     resolution = options.get("resolution", "640x480")
#     bitrate = options.get("bitrate", "800k")
#     segment_time = options.get("segment_time", 4)
    
#     # Commande FFmpeg pour convertir RTSP en HLS
#     cmd = [
#         "ffmpeg",
#         "-i", rtsp_url,
#         "-c:v", "libx264",
#         "-c:a", "aac",
#         "-b:v", bitrate,
#         "-s", resolution,
#         "-f", "hls",
#         "-hls_time", str(segment_time),
#         "-hls_list_size", "10",
#         "-hls_flags", "delete_segments+append_list",
#         "-hls_segment_filename", f"{hls_output_path}/segment_%03d.ts",
#         f"{hls_output_path}/playlist.m3u8"
#     ]
    
#     try:
#         # Démarrer le processus FFmpeg avec son propre groupe de processus
#         process = subprocess.Popen(
#             cmd, 
#             stdout=subprocess.PIPE, 
#             stderr=subprocess.PIPE,
#             preexec_fn=os.setsid  # Permet d'envoyer des signaux au groupe de processus
#         )
        
#         # Enregistrer le processus dans le dictionnaire des conversions actives
#         active_conversions[stream_id] = process
        
#         # Mettre à jour l'URL HLS dans les données des streams
#         streams = read_streams()
#         for i, stream in enumerate(streams):
#             if stream["id"] == stream_id:
#                 streams[i]["hls_url"] = f"/hls/stream_{stream_id}/playlist.m3u8"
#                 write_streams(streams)
#                 break
        
#         logger.info(f"Conversion RTSP vers HLS démarrée pour stream_id {stream_id}")
#         return True
#     except Exception as e:
#         logger.error(f"Erreur lors du démarrage de la conversion: {e}")
#         return False

# @router.post("/api/convert-rtsp/{stream_id}")
# async def convert_rtsp(stream_id: int, options: ConversionOptions = None):
#     if options is None:
#         options = ConversionOptions()
    
#     streams = read_streams()
#     stream = next((s for s in streams if s["id"] == stream_id), None)
    
#     if not stream:
#         raise HTTPException(status_code=404, detail="Stream non trouvé")
    
#     if stream["type"] != "rtsp":
#         raise HTTPException(status_code=400, detail="Ce stream n'est pas de type RTSP")
    
#     # Arrêter la conversion précédente si elle existe
#     stop_conversion(stream_id)
    
#     # Supprimer les anciens fichiers HLS s'ils existent
#     hls_path = os.path.join(HLS_OUTPUT_DIR, f"stream_{stream_id}")
#     if os.path.exists(hls_path):
#         shutil.rmtree(hls_path)
#         os.makedirs(hls_path, exist_ok=True)
    
#     # Démarrer la conversion
#     options_dict = options.dict()
#     success = start_rtsp_conversion(stream_id, stream["url"], options_dict)
    
#     if success:
#         return {
#             "status": "success",
#             "message": "Conversion RTSP vers HLS démarrée",
#             "stream_id": stream_id,
#             "hls_url": f"/hls/stream_{stream_id}/playlist.m3u8"
#         }
#     else:
#         raise HTTPException(status_code=500, detail="Erreur lors du démarrage de la conversion")

# @router.get("/api/rtsp-status/{stream_id}")
# async def rtsp_status(stream_id: int):
#     streams = read_streams()
#     stream = next((s for s in streams if s["id"] == stream_id), None)
    
#     if not stream:
#         raise HTTPException(status_code=404, detail="Stream non trouvé")
    
#     # Vérifier si le processus de conversion est actif
#     is_active = stream_id in active_conversions
    
#     # Vérifier si les fichiers HLS existent
#     hls_path = os.path.join(HLS_OUTPUT_DIR, f"stream_{stream_id}")
#     playlist_path = os.path.join(hls_path, "playlist.m3u8")
#     has_hls_files = os.path.exists(playlist_path)
    
#     segments_count = 0
#     if has_hls_files:
#         # Compter les segments .ts
#         segments_count = len([f for f in os.listdir(hls_path) if f.endswith('.ts')])
    
#     return {
#         "stream_id": stream_id,
#         "conversion_active": is_active,
#         "has_hls_files": has_hls_files,
#         "segments_count": segments_count,
#         "hls_url": stream.get("hls_url", None)
#     }

# @router.post("/api/stop-rtsp/{stream_id}")
# async def stop_rtsp(stream_id: int):
#     streams = read_streams()
#     stream = next((s for s in streams if s["id"] == stream_id), None)
    
#     if not stream:
#         raise HTTPException(status_code=404, detail="Stream non trouvé")
    
#     stop_conversion(stream_id)
    
#     return {
#         "status": "success",
#         "message": f"Conversion du stream {stream_id} arrêtée"
#     }

# # Cette fonction sera appelée dans le fichier main.py pour monter les fichiers statiques
# def mount_static_files(app):
#     # Monter le répertoire HLS pour servir les fichiers du stream
#     app.mount("/hls", StaticFiles(directory=HLS_OUTPUT_DIR), name="hls")


  






