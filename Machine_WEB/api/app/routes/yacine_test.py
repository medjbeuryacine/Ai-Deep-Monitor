# from fastapi import APIRouter, HTTPException, UploadFile, File, Query, BackgroundTasks, Request
# from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from typing import Dict, Any, List, Optional
# from pydantic import BaseModel
# import requests
# import json
# import os
# import logging
# import time
# import asyncio
# import subprocess
# import uuid
# import shutil
# import re

# # Configuration du logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("video-processing-api")

# # Constantes pour les chemins de fichiers
# VIDEOS_DIR = "videos"
# HLS_OUTPUT_DIR = "streams/hls_output"
# YOUTUBE_PROCESSES_FILE = "streams/youtube_processes.json"
# HLS_CONVERSIONS_FILE = "streams/hls_conversions.json"

# # Créer les répertoires nécessaires
# os.makedirs(os.path.dirname(YOUTUBE_PROCESSES_FILE), exist_ok=True)
# os.makedirs(VIDEOS_DIR, exist_ok=True)
# os.makedirs(HLS_OUTPUT_DIR, exist_ok=True)

# # Configuration de l'API GPU
# GPU_API_BASE_URL = "http://192.168.1.153:8020"  # Adresse de la machine GPU

# # Création de l'application FastAPI

# router = APIRouter(tags=["TEST Video Processing TEST"])

# # Modèles Pydantic
# class YoutubeProcessConfig(BaseModel):
#     url: str
#     detect: str = "all"  # person,face,phone,all
#     quality: str = "hd"  # hd ou low
#     loop: bool = False

# # Fonctions utilitaires pour la gestion des données
# def read_youtube_processes():
#     if not os.path.exists(YOUTUBE_PROCESSES_FILE):
#         with open(YOUTUBE_PROCESSES_FILE, 'w') as f:
#             json.dump({}, f)
#         return {}
    
#     try:
#         with open(YOUTUBE_PROCESSES_FILE, 'r') as f:
#             return json.load(f)
#     except json.JSONDecodeError:
#         return {}

# def write_youtube_processes(processes):
#     processes_copy = {}
#     for pid, data in processes.items():
#         # Convertir les timestamps en strings pour le JSON
#         process_data = {k: str(v) if isinstance(v, float) and k.endswith('_at') else v 
#                         for k, v in data.items()}
#         processes_copy[pid] = process_data
    
#     with open(YOUTUBE_PROCESSES_FILE, 'w') as f:
#         json.dump(processes_copy, f, indent=2)

# def get_next_process_id():
#     """Génère un ID unique pour le prochain processus"""
#     return str(uuid.uuid4())

# def extract_youtube_info(url):
#     """Extrait des informations basiques depuis l'URL YouTube"""
#     # Extraire l'ID YouTube
#     youtube_id = None
#     youtube_regex = r"(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^\"&?\/\s]{11})"
#     match = re.search(youtube_regex, url)
#     if match:
#         youtube_id = match.group(1)
        
#     # Si on a un ID, essayer d'obtenir le titre
#     title = None
#     if youtube_id:
#         try:
#             result = subprocess.run(
#                 ["yt-dlp", "--skip-download", "--print", "title", url],
#                 capture_output=True,
#                 text=True,
#                 check=True
#             )
#             title = result.stdout.strip()
#         except Exception as e:
#             logger.warning(f"Impossible d'extraire le titre: {str(e)}")
#             title = f"YouTube video {youtube_id}"
    
#     return {
#         "youtube_id": youtube_id,
#         "title": title or "Video sans titre"
#     }

# # Fonctions pour gérer les conversions HLS
# def read_hls_conversions():
#     if not os.path.exists(HLS_CONVERSIONS_FILE):
#         with open(HLS_CONVERSIONS_FILE, 'w') as f:
#             json.dump({}, f)
#         return {}
    
#     try:
#         with open(HLS_CONVERSIONS_FILE, 'r') as f:
#             return json.load(f)
#     except json.JSONDecodeError:
#         return {}

# def write_hls_conversion(stream_id, conversion_data):
#     conversions = read_hls_conversions()
#     conversions[stream_id] = conversion_data
    
#     with open(HLS_CONVERSIONS_FILE, 'w') as f:
#         json.dump(conversions, f, indent=2)

# def update_hls_conversion_status(stream_id, status):
#     conversions = read_hls_conversions()
#     if stream_id in conversions:
#         conversions[stream_id]["status"] = status
#         conversions[stream_id]["updated_at"] = time.time()
        
#         with open(HLS_CONVERSIONS_FILE, 'w') as f:
#             json.dump(conversions, f, indent=2)
#         return True
#     return False

# # Fonction pour surveiller le processus de conversion
# async def monitor_hls_conversion(stream_id, process):
#     """Surveille le processus FFmpeg et met à jour le statut de conversion."""
#     try:
#         # Attendre la fin du processus
#         return_code = await process.wait()

#         if return_code == 0:
#             update_hls_conversion_status(stream_id, "completed")
#             logger.info(f"Conversion HLS terminée avec succès pour {stream_id}")
#         else:
#             update_hls_conversion_status(stream_id, "failed")
#             logger.error(f"Erreur lors de la conversion HLS pour {stream_id}, code: {return_code}")
#     except Exception as e:
#         logger.error(f"Erreur lors de la surveillance du processus de conversion: {str(e)}")
#         update_hls_conversion_status(stream_id, "error")

# # Fonction pour surveiller le processus YouTube
# async def monitor_youtube_process(process_id: str):
#     """Fonction de surveillance en arrière-plan pour un processus YouTube."""
#     check_interval = 15  # secondes entre chaque vérification
#     max_retries = 3
#     retry_count = 0
    
#     while True:
#         # Lire les données actuelles
#         processes = read_youtube_processes()
#         if process_id not in processes:
#             logger.info(f"Processus {process_id} non trouvé, arrêt de la surveillance")
#             break
            
#         process_info = processes[process_id]
        
#         # Si le processus est arrêté ou terminé, on arrête la surveillance
#         if process_info.get("gpu_status") in ["stopped", "finished", "error"]:
#             logger.info(f"Processus {process_id} déjà terminé ({process_info.get('gpu_status')}), arrêt de la surveillance")
#             break
            
#         try:
#             # Vérifier le statut sur l'API GPU
#             response = requests.get(f"{GPU_API_BASE_URL}/api/status")
            
#             if response.status_code == 200:
#                 status_data = response.json()
#                 retry_count = 0  # Réinitialiser le compteur d'erreurs
                
#                 # Vérifier si c'est bien notre processus
#                 if status_data.get("url") == process_info["config"]["url"]:
#                     # Mettre à jour le statut
#                     process_info["status"] = status_data
#                     process_info["last_updated"] = time.time()
#                     process_info["view_url"] = status_data.get("view_url")
                    
#                     # Si le processus n'est plus actif sur la machine GPU
#                     if not status_data.get("active", False):
#                         process_info["gpu_status"] = "finished"
#                         process_info["finished_at"] = time.time()
#                         logger.info(f"Processus {process_id} terminé sur la machine GPU")
#                 else:
#                     # Un autre processus est en cours sur la GPU
#                     logger.warning(f"Un autre processus est en cours sur la GPU, marquage du processus {process_id} comme obsolète")
#                     process_info["gpu_status"] = "superseded"
#                     process_info["finished_at"] = time.time()
                
#                 # Sauvegarder les changements
#                 processes[process_id] = process_info
#                 write_youtube_processes(processes)
                
#                 # Si le processus est terminé, on arrête la surveillance
#                 if process_info["gpu_status"] not in ["running"]:
#                     break
                    
#             else:
#                 logger.warning(f"Échec de la vérification du statut pour {process_id}: {response.status_code}")
#                 retry_count += 1
                
#         except requests.RequestException as e:
#             logger.error(f"Erreur lors de la surveillance du processus {process_id}: {str(e)}")
#             retry_count += 1
        
#         # Si trop d'erreurs consécutives, marquer comme en erreur
#         if retry_count >= max_retries:
#             logger.error(f"Trop d'erreurs pour le processus {process_id}, marquage comme en erreur")
#             processes = read_youtube_processes()
#             if process_id in processes:
#                 processes[process_id]["gpu_status"] = "error"
#                 processes[process_id]["error_at"] = time.time()
#                 processes[process_id]["error_message"] = "Communication perdue avec la machine GPU"
#                 write_youtube_processes(processes)
#             break
            
#         # Attendre avant la prochaine vérification
#         await asyncio.sleep(check_interval)
    
#     logger.info(f"Surveillance du processus {process_id} terminée")

# # ROUTES API

# # 1. Upload de vidéo
# @router.post("/api/upload-video")
# async def upload_video(file: UploadFile = File(...)):
#     if not file.content_type.startswith("video/"):
#         raise HTTPException(status_code=400, detail="Seuls les fichiers vidéo sont autorisés")
   
#     # Sécuriser le nom du fichier
#     original_filename = file.filename
#     safe_filename = "".join(c for c in original_filename if c.isalnum() or c in (' ', '.', '-', '_')).rstrip()
   
#     # Ajouter un UUID pour éviter les collisions
#     unique_id = uuid.uuid4().hex
#     file_extension = os.path.splitext(safe_filename)[1]
#     stored_filename = f"{unique_id}_{safe_filename}"
#     file_path = os.path.join(VIDEOS_DIR, stored_filename)
   
#     with open(file_path, "wb") as buffer:
#         shutil.copyfileobj(file.file, buffer)
   
#     video_url = f"/api/videos/{stored_filename}"

#     return {
#         "url": video_url,
#         "type": file.content_type.split("/")[1],
#         "original_filename": original_filename,
#         "process_url": f"/api/process-uploaded-video?url={video_url}"
#     }

# @router.get("/api/videos/{filename}")
# async def get_video(filename: str):
#     file_path = os.path.join(VIDEOS_DIR, filename)
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="Vidéo non trouvée")
   
#     return FileResponse(file_path)

# @router.get("/api/videos")
# async def list_videos():
#     videos = []
#     for file in os.listdir(VIDEOS_DIR):
#         if os.path.isfile(os.path.join(VIDEOS_DIR, file)):
#             videos.append({
#                 "filename": file,
#                 "url": f"/api/videos/{file}",
#                 "process_url": f"/api/process-uploaded-video?url=/api/videos/{file}"
#             })
#     return videos

# @router.delete("/api/videos/{filename}")
# async def delete_video(filename: str):
#     """Supprime une vidéo uploadée."""
#     file_path = os.path.join(VIDEOS_DIR, filename)
    
#     if not os.path.exists(file_path):
#         raise HTTPException(status_code=404, detail="Vidéo non trouvée")
    
#     try:
#         os.remove(file_path)
#         return {"message": "Vidéo supprimée avec succès", "filename": filename}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


# # 2. Traitement d'une vidéo uploadée avec IA
# @router.get("/api/process-uploaded-video")
# async def process_uploaded_video(
#     url: str = Query(..., description="URL de la vidéo uploadée"),
#     detect: str = Query("all", description="Type de détection (person,face,phone,all)"),
#     quality: str = Query("hd", description="Qualité (hd ou low)")
# ):
#     # Vérifier que l'URL pointe vers une vidéo uploadée
#     if not url.startswith("/api/videos/"):
#         raise HTTPException(status_code=400, detail="L'URL doit pointer vers une vidéo uploadée")
    
#     # Utiliser l'API de process_and_convert existante
#     try:
#         # URL complète pour la requête
#         video_url = f"http://localhost{url}" if url.startswith("/") else url
        
#         # Appeler la fonction de traitement
#         stream_id = str(uuid.uuid4())
        
#         # Préparer les paramètres pour l'API GPU
#         gpu_params = {
#             "url": video_url,
#             "detect": detect,
#             "q": quality,
#             "loop": False
#         }
        
#         # Appel à l'API GPU
#         gpu_response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=gpu_params)
#         gpu_response.raise_for_status()
#         gpu_data = gpu_response.json()
        
#         if not gpu_data.get("view_url"):
#             raise HTTPException(status_code=500, detail="Échec du traitement GPU - pas d'URL de visionnage retournée")
        
#         # Convertir le flux GPU en HLS
#         hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#         os.makedirs(hls_dir, exist_ok=True)
#         hls_playlist = os.path.join(hls_dir, "playlist.m3u8")
        
#         # Commande FFmpeg pour convertir le flux GPU en HLS
#         command = [
#             "ffmpeg",
#             "-i", gpu_data["view_url"],
#             "-c:v", "libx264",
#             "-c:a", "aac",
#             "-hls_time", "4",
#             "-hls_list_size", "10",
#             "-hls_flags", "delete_segments",
#             "-f", "hls",
#             hls_playlist
#         ]
        
#         # Lancer FFmpeg en arrière-plan
#         ffmpeg_process = await asyncio.create_subprocess_exec(
#             *command,
#             stdout=asyncio.subprocess.PIPE,
#             stderr=asyncio.subprocess.PIPE
#         )
        
#         # Enregistrer les informations de conversion
#         conversion_info = {
#             "stream_id": stream_id,
#             "source_url": url,
#             "gpu_view_url": gpu_data["view_url"],
#             "hls_url": f"/api/hls/{stream_id}/playlist.m3u8",
#             "created_at": time.time(),
#             "status": "converting",
#             "ffmpeg_pid": ffmpeg_process.pid,
#             "detection_type": detect,
#             "quality": quality,
#             "is_uploaded_video": True
#         }
        
#         write_hls_conversion(stream_id, conversion_info)
        
#         # Lancer la surveillance de la conversion
#         asyncio.create_task(monitor_hls_conversion(stream_id, ffmpeg_process))
        
#         return {
#             "stream_id": stream_id,
#             "hls_url": f"/api/hls/{stream_id}/playlist.m3u8",
#             "gpu_view_url": gpu_data["view_url"],
#             "status": "processing"
#         }
    
#     except requests.RequestException as e:
#         raise HTTPException(status_code=502, detail=f"Erreur de l'API GPU: {str(e)}")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur de traitement: {str(e)}")

# # 3. Traitement d'une URL YouTube avec IA
# @router.post("/api/youtube/process")
# async def youtube_process(config: YoutubeProcessConfig, background_tasks: BackgroundTasks):
#     """Traite une vidéo YouTube avec détection IA et la convertit en HLS."""
#     try:
#         # Étape 1: Envoyer à la GPU pour traitement
#         process_id = get_next_process_id()
#         gpu_params = {
#             "url": config.url,
#             "detect": config.detect,
#             "q": config.quality,
#             "loop": config.loop
#         }

#         gpu_response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=gpu_params)
#         gpu_response.raise_for_status()
#         gpu_data = gpu_response.json()

#         if not gpu_data.get("view_url"):
#             raise HTTPException(status_code=500, detail="Échec du traitement GPU - pas d'URL de visionnage retournée")

#         # Étape 2: Convertir le flux GPU en HLS
#         stream_id = str(uuid.uuid4())
#         hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#         os.makedirs(hls_dir, exist_ok=True)
#         hls_playlist = os.path.join(hls_dir, "playlist.m3u8")

#         # Commande FFmpeg pour convertir le flux GPU en HLS
#         command = [
#             "ffmpeg",
#             "-i", gpu_data["view_url"],
#             "-c:v", "libx264",
#             "-c:a", "aac",
#             "-hls_time", "4",
#             "-hls_list_size", "10",
#             "-hls_flags", "delete_segments",
#             "-f", "hls",
#             hls_playlist
#         ]

#         # Lancer FFmpeg en arrière-plan
#         ffmpeg_process = await asyncio.create_subprocess_exec(
#             *command,
#             stdout=asyncio.subprocess.PIPE,
#             stderr=asyncio.subprocess.PIPE
#         )

#         # Extraire les informations YouTube
#         youtube_info = extract_youtube_info(config.url)

#         # Enregistrer les informations de conversion
#         conversion_info = {
#             "stream_id": stream_id,
#             "source_url": config.url,
#             "gpu_view_url": gpu_data["view_url"],
#             "hls_url": f"/api/hls/{stream_id}/playlist.m3u8",
#             "title": youtube_info.get("title", "YouTube Stream"),
#             "created_at": time.time(),
#             "status": "converting",
#             "ffmpeg_pid": ffmpeg_process.pid,
#             "detection_type": config.detect,
#             "quality": config.quality,
#             "is_youtube": True
#         }

#         write_hls_conversion(stream_id, conversion_info)

#         # Lancer la surveillance de la conversion
#         background_tasks.add_task(monitor_hls_conversion, stream_id, ffmpeg_process)

#         # Enregistrer les informations du processus YouTube
#         process_info = {
#             "id": process_id,
#             "config": config.dict(),
#             "status": gpu_data,
#             "started_at": time.time(),
#             "gpu_status": "running",
#             "view_url": gpu_data.get("view_url"),
#             "hls_url": conversion_info["hls_url"],
#             "title": youtube_info.get("title", "YouTube Stream"),
#             "youtube_id": youtube_info.get("youtube_id")
#         }

#         processes = read_youtube_processes()
#         processes[process_id] = process_info
#         write_youtube_processes(processes)

#         # Lancer la surveillance du processus YouTube
#         background_tasks.add_task(monitor_youtube_process, process_id)

#         return {
#             "process_id": process_id,
#             "stream_id": stream_id,
#             "hls_url": conversion_info["hls_url"],
#             "gpu_view_url": gpu_data["view_url"],
#             "status": "processing",
#             "title": youtube_info.get("title", "YouTube Stream")
#         }
    
#     except requests.RequestException as e:
#         logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#         raise HTTPException(status_code=502, detail=f"Erreur de l'API GPU: {str(e)}")
#     except Exception as e:
#         logger.error(f"Erreur lors du traitement YouTube: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur de conversion: {str(e)}")
        

# @router.put("/api/youtube/process/{process_id}")
# async def update_youtube_process(process_id: str, config: YoutubeProcessConfig, background_tasks: BackgroundTasks):
#     """Met à jour un processus YouTube existant avec de nouveaux paramètres."""
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     # Arrêter d'abord le processus existant
#     try:
#         requests.get(f"{GPU_API_BASE_URL}/api/stop")
#     except:
#         # Ignorer les erreurs lors de l'arrêt, continuer avec le nouveau processus
#         pass
    
#     # Démarrer un nouveau processus avec les nouveaux paramètres
#     try:
#         gpu_params = {
#             "url": config.url,
#             "detect": config.detect,
#             "q": config.quality,
#             "loop": config.loop
#         }
        
#         gpu_response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=gpu_params)
#         gpu_response.raise_for_status()
#         gpu_data = gpu_response.json()
        
#         if not gpu_data.get("view_url"):
#             raise HTTPException(status_code=500, detail="Échec du traitement GPU - pas d'URL de visionnage retournée")
        
#         # Créer un nouveau stream HLS
#         stream_id = str(uuid.uuid4())
#         hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#         os.makedirs(hls_dir, exist_ok=True)
#         hls_playlist = os.path.join(hls_dir, "playlist.m3u8")
        
#         # Commande FFmpeg pour convertir le flux GPU en HLS
#         command = [
#             "ffmpeg",
#             "-i", gpu_data["view_url"],
#             "-c:v", "libx264",
#             "-c:a", "aac",
#             "-hls_time", "4",
#             "-hls_list_size", "10",
#             "-hls_flags", "delete_segments",
#             "-f", "hls",
#             hls_playlist
#         ]
        
#         # Lancer FFmpeg en arrière-plan
#         ffmpeg_process = await asyncio.create_subprocess_exec(
#             *command,
#             stdout=asyncio.subprocess.PIPE,
#             stderr=asyncio.subprocess.PIPE
#         )
        
#         # Extraire les informations YouTube
#         youtube_info = extract_youtube_info(config.url)
        
#         # Enregistrer les informations de conversion
#         conversion_info = {
#             "stream_id": stream_id,
#             "source_url": config.url,
#             "gpu_view_url": gpu_data["view_url"],
#             "hls_url": f"/api/hls/{stream_id}/playlist.m3u8",
#             "title": youtube_info.get("title", "YouTube Stream"),
#             "created_at": time.time(),
#             "status": "converting",
#             "ffmpeg_pid": ffmpeg_process.pid,
#             "detection_type": config.detect,
#             "quality": config.quality,
#             "is_youtube": True
#         }
        
#         write_hls_conversion(stream_id, conversion_info)
        
#         # Lancer la surveillance de la conversion
#         background_tasks.add_task(monitor_hls_conversion, stream_id, ffmpeg_process)
        
#         # Mettre à jour les informations du processus
#         processes[process_id] = {
#             "id": process_id,
#             "config": config.dict(),
#             "status": gpu_data,
#             "started_at": time.time(),
#             "gpu_status": "running",
#             "view_url": gpu_data.get("view_url"),
#             "hls_url": conversion_info["hls_url"],
#             "title": youtube_info.get("title", "YouTube Stream"),
#             "youtube_id": youtube_info.get("youtube_id"),
#             "updated_at": time.time()
#         }
        
#         write_youtube_processes(processes)
        
#         # Lancer la surveillance du processus YouTube
#         background_tasks.add_task(monitor_youtube_process, process_id)
        
#         return {
#             "process_id": process_id,
#             "stream_id": stream_id,
#             "hls_url": conversion_info["hls_url"],
#             "gpu_view_url": gpu_data["view_url"],
#             "status": "processing",
#             "title": youtube_info.get("title", "YouTube Stream"),
#             "message": "Processus mis à jour avec succès"
#         }
        
#     except requests.RequestException as e:
#         raise HTTPException(status_code=502, detail=f"Erreur de l'API GPU: {str(e)}")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour du processus: {str(e)}")

# @router.delete("/api/youtube/process/{process_id}")
# async def stop_youtube_process(process_id: str):
#     """Arrête un processus YouTube en cours et le supprime."""
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     try:
#         # Demander à l'API GPU d'arrêter le processus
#         response = requests.get(f"{GPU_API_BASE_URL}/api/stop")
        
#         # Mettre à jour le statut
#         process_info["gpu_status"] = "stopped"
#         process_info["stopped_at"] = time.time()
#         processes[process_id] = process_info
#         write_youtube_processes(processes)
        
#         return {"message": "Processus arrêté avec succès", "process_id": process_id}
        
#     except requests.RequestException as e:
#         raise HTTPException(status_code=502, detail=f"Erreur de l'API GPU: {str(e)}")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de l'arrêt du processus: {str(e)}")




# # 4. Endpoint pour servir les fichiers HLS
# @router.get("/api/hls/{stream_id}/playlist.m3u8")
# async def get_hls_playlist(stream_id: str):
#     """Sert le fichier playlist.m3u8 pour un stream spécifique."""
#     file_path = os.path.join(HLS_OUTPUT_DIR, stream_id, "playlist.m3u8")
#     if os.path.exists(file_path):
#         return FileResponse(file_path, media_type="application/vnd.apple.mpegurl")
#     raise HTTPException(status_code=404, detail="Fichier HLS non trouvé")

# @router.delete("/api/hls/{stream_id}")
# async def delete_hls_stream(stream_id: str):
#     """Supprime un stream HLS et ses fichiers associés."""
#     conversions = read_hls_conversions()
    
#     if stream_id not in conversions:
#         raise HTTPException(status_code=404, detail="Stream HLS non trouvé")
    
#     # Supprimer le répertoire contenant les fichiers HLS
#     hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#     try:
#         if os.path.exists(hls_dir):
#             shutil.rmtree(hls_dir)
        
#         # Supprimer de la liste des conversions
#         del conversions[stream_id]
#         with open(HLS_CONVERSIONS_FILE, 'w') as f:
#             json.dump(conversions, f, indent=2)
            
#         return {"message": "Stream HLS supprimé avec succès", "stream_id": stream_id}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")


# @router.put("/api/hls/{stream_id}")
# async def update_hls_stream(stream_id: str, quality: str = Query("hd", description="Qualité (hd ou low)")):
#     """Met à jour les paramètres d'un stream HLS existant."""
#     conversions = read_hls_conversions()
    
#     if stream_id not in conversions:
#         raise HTTPException(status_code=404, detail="Stream HLS non trouvé")
    
#     # Mettre à jour les paramètres
#     conversions[stream_id]["quality"] = quality
#     conversions[stream_id]["updated_at"] = time.time()
    
#     # Sauvegarder les changements
#     with open(HLS_CONVERSIONS_FILE, 'w') as f:
#         json.dump(conversions, f, indent=2)
    
#     return {
#         "message": "Paramètres HLS mis à jour avec succès",
#         "stream_id": stream_id,
#         "quality": quality
#     }


# @router.get("/api/hls/{stream_id}/{segment_file}")
# async def get_hls_segment(stream_id: str, segment_file: str):
#     """Sert les segments .ts pour un stream spécifique."""
#     if not segment_file.endswith('.ts'):
#         raise HTTPException(status_code=400, detail="Type de fichier non autorisé")
    
#     file_path = os.path.join(HLS_OUTPUT_DIR, stream_id, segment_file)
#     if os.path.exists(file_path):
#         return FileResponse(file_path, media_type="video/mp2t")
#     raise HTTPException(status_code=404, detail="Segment HLS non trouvé")

# # 5. Endpoint pour obtenir le statut d'une conversion HLS
# @router.get("/api/hls/status/{stream_id}")
# async def get_hls_status(stream_id: str):
#     """Récupère le statut d'une conversion HLS."""
#     conversions = read_hls_conversions()
    
#     if stream_id not in conversions:
#         raise HTTPException(status_code=404, detail="Conversion HLS non trouvée")
    
#     # Vérifier si le fichier HLS existe réellement
#     conversion = conversions[stream_id]
#     playlist_path = os.path.join(HLS_OUTPUT_DIR, stream_id, "playlist.m3u8")
    
#     conversion["file_exists"] = os.path.exists(playlist_path)
    
#     # Si le fichier existe, obtenir des informations supplémentaires
#     if conversion["file_exists"]:
#         try:
#             # Obtenir la taille du fichier playlist
#             conversion["playlist_size"] = os.path.getsize(playlist_path)
            
#             # Compter les segments .ts
#             segment_dir = os.path.dirname(playlist_path)
#             ts_segments = [f for f in os.listdir(segment_dir) if f.endswith('.ts')]
#             conversion["segment_count"] = len(ts_segments)
            
#             # Estimer la durée totale (segments * durée par segment)
#             if conversion["segment_count"] > 0:
#                 conversion["estimated_duration"] = conversion["segment_count"] * 4  # 4 secondes par segment
#         except Exception as e:
#             logger.warning(f"Erreur lors de la récupération des informations de fichier: {str(e)}")
    
#     return conversion

# # 6. Endpoint pour obtenir des infos sur une URL YouTube avant traitement
# @router.get("/api/youtube/info")
# async def get_youtube_info(url: str):
#     """Récupère des informations sur une vidéo YouTube."""
#     try:
#         # Commande pour obtenir plusieurs informations en une seule fois
#         result = subprocess.run(
#             ["yt-dlp", "--skip-download", "--print", "title,is_live,duration", url],
#             capture_output=True,
#             text=True,
#             check=True
#         )
        
#         output = result.stdout.strip().split('\n')
        
#         if len(output) >= 3:
#             title = output[0]
#             is_live = output[1] == "True"
#             duration = int(output[2]) if output[2].isdigit() else None
            
#             # Formatage de la durée
#             formatted_duration = None
#             if duration is not None:
#                 hours = duration // 3600
#                 minutes = (duration % 3600) // 60
#                 seconds = duration % 60
                
#                 if hours > 0:
#                     formatted_duration = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
#                 else:
#                     formatted_duration = f"{minutes:02d}:{seconds:02d}"
            
#             return {
#                 "url": url,
#                 "title": title,
#                 "is_live": is_live,
#                 "duration": duration,
#                 "duration_formatted": formatted_duration
#             }
#         else:
#             return {"error": "Format de sortie inattendu de yt-dlp"}
            
#     except subprocess.CalledProcessError as e:
#         logger.error(f"Erreur lors de la récupération des infos YouTube: {e.stderr}")
#         raise HTTPException(status_code=400, 
#                            detail=f"Impossible d'obtenir les informations de la vidéo YouTube: {e.stderr}")
#     except Exception as e:
#         logger.error(f"Erreur générale: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

# # 7. Endpoint pour lister toutes les conversions actives
# @router.get("/api/active-streams")
# async def get_active_streams():
#     """Liste toutes les conversions HLS actives."""
#     conversions = read_hls_conversions()
    
#     active_streams = {}
#     for stream_id, data in conversions.items():
#         if data.get("status") in ["converting", "processing"]:
#             # Vérifier si le fichier HLS existe
#             playlist_path = os.path.join(HLS_OUTPUT_DIR, stream_id, "playlist.m3u8")
#             data["file_exists"] = os.path.exists(playlist_path)
#             active_streams[stream_id] = data
    
#     return active_streams