# from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Request, FastAPI
# from fastapi.responses import JSONResponse, RedirectResponse
# from fastapi.middleware.cors import CORSMiddleware
# import requests
# import json
# import os
# import logging
# import time
# import asyncio
# from typing import Dict, Any, List, Optional
# from pydantic import BaseModel
# import re

# # Configuration de logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("youtube-api-integration")

# # Fichier pour stocker les données des processus YouTube
# YOUTUBE_PROCESSES_FILE = "streams/youtube_processes.json"
# COUNTER_FILE = "streams/process_counter.json"
# os.makedirs(os.path.dirname(YOUTUBE_PROCESSES_FILE), exist_ok=True)

# # Configuration de l'API GPU
# GPU_API_BASE_URL = "http://192.168.1.153:8050"  # Adresse de la machine GPU

# # Router pour les opérations YouTube/RTSP
# router = APIRouter(tags=["YOUTUBE-RTSP"])

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
#     """Génère un ID séquentiel pour le prochain processus"""
#     if not os.path.exists(COUNTER_FILE):
#         with open(COUNTER_FILE, 'w') as f:
#             json.dump({"counter": 1}, f)
#         return "1"
    
#     try:
#         with open(COUNTER_FILE, 'r') as f:
#             data = json.load(f)
#             counter = data.get("counter", 1)
            
#         # Incrémenter pour le prochain ID
#         counter += 1
#         with open(COUNTER_FILE, 'w') as f:
#             json.dump({"counter": counter}, f)
            
#         return str(counter - 1)  # Retourner l'ID actuel (avant incrémentation)
#     except:
#         # En cas d'erreur, créer un nouveau compteur
#         with open(COUNTER_FILE, 'w') as f:
#             json.dump({"counter": 2}, f)
#         return "1"

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
#             import subprocess
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

# @router.post("/api/youtube/start")
# async def start_youtube_processing(config: YoutubeProcessConfig, background_tasks: BackgroundTasks, request: Request):
#     """Démarre le traitement d'une vidéo YouTube sur la machine GPU."""
#     # Lire les processus existants
#     processes = read_youtube_processes()
    
#     # Générer un ID séquentiel simple pour ce processus
#     process_id = get_next_process_id()
#     youtube_info = extract_youtube_info(config.url)
    
#     try:
#         # Préparer les paramètres pour l'API GPU
#         params = {
#             "url": config.url,
#             "detect": config.detect,
#             "q": config.quality,
#             "loop": config.loop
#         }
        
#         # Appel à l'API GPU
#         try:
#             response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=params)
#             response.raise_for_status()
#         except requests.RequestException as e:
#             logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#             raise HTTPException(status_code=503, 
#                                detail=f"Impossible de se connecter à la machine GPU: {str(e)}")
        
#         # Extraire les données de la réponse
#         response_data = response.json()
        
#         # Créer l'entrée pour ce processus
#         process_info = {
#             "id": process_id,
#             "youtube_id": youtube_info.get("youtube_id"),
#             "title": youtube_info.get("title"),
#             "config": config.dict(),
#             "status": response_data,
#             "started_at": time.time(),
#             "gpu_status": "running",
#             "client_ip": request.client.host,
#             "last_updated": time.time(),
#             "view_url": response_data.get("view_url")  # Récupérer l'URL de visualisation
#         }
        
#         # Stocker dans notre dictionnaire
#         processes[process_id] = process_info
        
#         # Sauvegarder dans le fichier
#         write_youtube_processes(processes)
        
#         # Configurer la surveillance en arrière-plan
#         background_tasks.add_task(monitor_youtube_process, process_id)
        
#         # Préparer la réponse
#         return {
#             "process_id": process_id,
#             "status": "started",
#             "title": youtube_info.get("title"),
#             "rtsp_stream": response_data.get("rtsp_stream"),
#             "http_stream": response_data.get("http_stream"),
#             "view_url": response_data.get("view_url"),  # URL pour visualiser directement
#             "config": config.dict()
#         }
        
#     except HTTPException:
#         # Remonter les exceptions HTTP
#         raise
#     except Exception as e:
#         logger.error(f"Erreur inattendue: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

# @router.get("/api/youtube/status/{process_id}")
# async def get_youtube_process_status(process_id: str):
#     """Récupère le statut d'un processus YouTube spécifique."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     # Essayer de récupérer le statut frais depuis l'API GPU
#     try:
#         response = requests.get(f"{GPU_API_BASE_URL}/api/status")
#         if response.status_code == 200:
#             gpu_status = response.json()
#             # Vérifier que c'est bien notre processus
#             if gpu_status.get("url") == process_info["config"]["url"]:
#                 process_info["status"] = gpu_status
#                 process_info["last_updated"] = time.time()
#                 process_info["view_url"] = gpu_status.get("view_url")  # Mettre à jour l'URL de visualisation
#                 # Mise à jour du statut GPU
#                 if not gpu_status.get("active", False) and process_info["gpu_status"] == "running":
#                     process_info["gpu_status"] = "finished"
#                     process_info["finished_at"] = time.time()
#                 # Sauvegarde des changements
#                 processes[process_id] = process_info
#                 write_youtube_processes(processes)
#     except requests.RequestException as e:
#         logger.warning(f"Impossible de mettre à jour le statut depuis l'API GPU: {str(e)}")
#         # On continue avec le dernier statut connu
    
#     return process_info

# @router.delete("/api/youtube/stop/{process_id}")
# async def stop_youtube_process(process_id: str):
#     """Arrête un processus YouTube spécifique."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     try:
#         # Demander à l'API GPU d'arrêter le processus
#         response = requests.get(f"{GPU_API_BASE_URL}/api/stop")
        
#         if response.status_code != 200:
#             logger.error(f"Échec de l'arrêt du processus: {response.text}")
#             raise HTTPException(status_code=response.status_code, 
#                                detail=f"Erreur lors de l'arrêt du processus: {response.json().get('error', 'Erreur inconnue')}")
        
#         # Mettre à jour le statut
#         process_info["gpu_status"] = "stopped"
#         process_info["stopped_at"] = time.time()
#         process_info["status"] = response.json()
#         processes[process_id] = process_info
        
#         # Sauvegarder les changements
#         write_youtube_processes(processes)
        
#         return {
#             "process_id": process_id,
#             "status": "stopped",
#             "message": response.json().get("status", "Processus arrêté")
#         }
        
#     except requests.RequestException as e:
#         logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#         raise HTTPException(status_code=503, 
#                            detail=f"Impossible de se connecter à la machine GPU: {str(e)}")

# @router.get("/api/youtube/processes")
# async def list_youtube_processes(active_only: bool = False):
#     """Liste tous les processus YouTube (actifs ou historiques)."""
#     processes = read_youtube_processes()
    
#     if active_only:
#         return {
#             k: v for k, v in processes.items() 
#             if v.get("gpu_status") == "running"
#         }
    
#     return processes

# # Nouvelle route pour accéder directement à la visualisation d'un processus par son ID
# @router.get("/api/youtube/view/{process_id}")
# async def view_youtube_process(process_id: str):
#     """Redirige vers la visualisation directe d'un processus YouTube spécifique."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     # Si le processus est actif, vérifier le statut sur la machine GPU
#     if process_info["gpu_status"] == "running":
#         try:
#             response = requests.get(f"{GPU_API_BASE_URL}/api/status")
#             if response.status_code == 200:
#                 gpu_status = response.json()
                
#                 # Si ce n'est pas notre processus actuel, démarrer avec l'URL correcte
#                 if gpu_status.get("url") != process_info["config"]["url"]:
#                     # Redémarrer le processus avec la bonne URL
#                     params = {
#                         "url": process_info["config"]["url"],
#                         "detect": process_info["config"]["detect"],
#                         "q": process_info["config"]["quality"],
#                         "loop": process_info["config"]["loop"]
#                     }
#                     restart_response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=params)
#                     if restart_response.status_code == 200:
#                         gpu_status = restart_response.json()
#         except requests.RequestException as e:
#             logger.warning(f"Impossible de vérifier le statut sur la machine GPU: {str(e)}")
    
#     # Accéder à l'URL de visualisation
#     view_url = process_info.get("view_url") or f"{GPU_API_BASE_URL}/api/view"
    
#     # Rediriger vers l'URL de visualisation
#     return RedirectResponse(url=view_url)

# # Nouvelle route pour démarrer/reprendre un processus existant
# @router.get("/api/youtube/resume/{process_id}")
# async def resume_youtube_process(process_id: str, background_tasks: BackgroundTasks):
#     """Redémarre un processus existant sur la machine GPU."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     try:
#         # Récupérer la configuration originale
#         config = process_info["config"]
        
#         # Préparer les paramètres pour l'API GPU
#         params = {
#             "url": config["url"],
#             "detect": config["detect"],
#             "q": config["quality"],
#             "loop": config["loop"]
#         }
        
#         # Appel à l'API GPU pour démarrer/reprendre le processus
#         response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=params)
#         response.raise_for_status()
        
#         response_data = response.json()
        
#         # Mise à jour du statut
#         process_info["gpu_status"] = "running"
#         process_info["resumed_at"] = time.time()
#         process_info["status"] = response_data
#         process_info["last_updated"] = time.time()
#         process_info["view_url"] = response_data.get("view_url")
        
#         # Sauvegarder les changements
#         processes[process_id] = process_info
#         write_youtube_processes(processes)
        
#         # Redémarrer la surveillance
#         background_tasks.add_task(monitor_youtube_process, process_id)
        
#         return {
#             "process_id": process_id,
#             "status": "resumed",
#             "title": process_info.get("title"),
#             "rtsp_stream": response_data.get("rtsp_stream"),
#             "http_stream": response_data.get("http_stream"),
#             "view_url": response_data.get("view_url")
#         }
        
#     except requests.RequestException as e:
#         logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#         raise HTTPException(status_code=503, 
#                            detail=f"Impossible de se connecter à la machine GPU: {str(e)}")
#     except Exception as e:
#         logger.error(f"Erreur inattendue: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

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
#                     process_info["view_url"] = status_data.get("view_url")  # Mettre à jour l'URL de visualisation
                    
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

# @router.get("/api/youtube/info")
# async def get_youtube_info(url: str):
#     """Récupère des informations sur une vidéo YouTube."""
#     try:
#         import subprocess
        
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

# # Point d'entrée pour récupérer un processus par son ID YouTube
# @router.get("/api/youtube/by-youtube-id/{youtube_id}")
# async def get_process_by_youtube_id(youtube_id: str):
#     """Récupère un processus par son ID YouTube."""
#     processes = read_youtube_processes()
    
#     # Rechercher par ID YouTube
#     matching_processes = []
#     for pid, process in processes.items():
#         if process.get("youtube_id") == youtube_id:
#             matching_processes.append(process)
    
#     if not matching_processes:
#         raise HTTPException(status_code=404, detail="Aucun processus trouvé pour cet ID YouTube")
    
#     # Trier par date de début (plus récent en premier)
#     sorted_processes = sorted(
#         matching_processes, 
#         key=lambda p: float(p.get("started_at", 0)) if isinstance(p.get("started_at"), str) else p.get("started_at", 0),
#         reverse=True
#     )
    
#     return {
#         "youtube_id": youtube_id,
#         "processes": sorted_processes
#     }





###############################
# NICOLAS ROUTE 
###############################



# from fastapi import APIRouter, HTTPException, Query, BackgroundTasks, Request, FastAPI
# from fastapi.responses import JSONResponse, RedirectResponse, FileResponse
# from fastapi.middleware.cors import CORSMiddleware
# import requests
# import json
# import os
# import logging
# import time
# import asyncio
# import subprocess
# import uuid
# from typing import Dict, Any, List, Optional
# from pydantic import BaseModel
# import re

# # Configuration de logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("youtube-api-integration")

# # Fichier pour stocker les données des processus YouTube
# YOUTUBE_PROCESSES_FILE = "streams/youtube_processes.json"
# COUNTER_FILE = "streams/process_counter.json"
# os.makedirs(os.path.dirname(YOUTUBE_PROCESSES_FILE), exist_ok=True)
# HLS_CONVERSIONS_FILE = "streams/hls_conversions.json"
# os.makedirs(os.path.dirname(HLS_CONVERSIONS_FILE), exist_ok=True)

# # Dossier où seront stockés les fichiers HLS
# HLS_OUTPUT_DIR = "streams/hls_output"
# os.makedirs(HLS_OUTPUT_DIR, exist_ok=True)

# # Configuration de l'API GPU
# GPU_API_BASE_URL = "http://192.168.1.153:8020"  # Adresse de la machine GPU



# # Router pour les opérations YouTube/RTSP
# router = APIRouter(tags=["YOUTUBE-RTSP"])

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
#     """Génère un ID séquentiel pour le prochain processus"""
#     if not os.path.exists(COUNTER_FILE):
#         with open(COUNTER_FILE, 'w') as f:
#             json.dump({"counter": 1}, f)
#         return "1"
    
#     try:
#         with open(COUNTER_FILE, 'r') as f:
#             data = json.load(f)
#             counter = data.get("counter", 1)
            
#         # Incrémenter pour le prochain ID
#         counter += 1
#         with open(COUNTER_FILE, 'w') as f:
#             json.dump({"counter": counter}, f)
            
#         return str(counter - 1)  # Retourner l'ID actuel (avant incrémentation)
#     except:
#         # En cas d'erreur, créer un nouveau compteur
#         with open(COUNTER_FILE, 'w') as f:
#             json.dump({"counter": 2}, f)
#         return "1"

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
#             import subprocess
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

# # Fonctions pour gérer les données des conversions HLS
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
#         _, stderr = await process.communicate()

#         # Vérifier le code de retour
#         return_code = process.returncode

#         if return_code == 0:
#             update_hls_conversion_status(stream_id, "completed")
#             logger.info(f"Conversion HLS terminée avec succès pour {stream_id}")
#         else:
#             update_hls_conversion_status(stream_id, "failed")
#             logger.error(f"Erreur lors de la conversion HLS pour {stream_id}, code: {return_code}")
#             error_output = stderr.decode('utf-8') if stderr else "Erreur inconnue"
#             logger.error(f"Erreurs FFmpeg: {error_output}")

#             # Mettre à jour le message d'erreur
#             conversions = read_hls_conversions()
#             if stream_id in conversions:
#                 conversions[stream_id]["error_message"] = error_output
#                 write_hls_conversion(stream_id, conversions[stream_id])

#     except Exception as e:
#         logger.error(f"Erreur lors de la surveillance du processus de conversion: {str(e)}")
#         update_hls_conversion_status(stream_id, "error")

# @router.post("/api/youtube/start")
# async def start_youtube_processing(config: YoutubeProcessConfig, background_tasks: BackgroundTasks, request: Request):
#     """Démarre le traitement d'une vidéo YouTube sur la machine GPU."""
#     processes = read_youtube_processes()
#     process_id = get_next_process_id()

#     try:
#         params = {
#             "url": config.url,
#             "detect": config.detect,
#             "q": config.quality,
#             "loop": config.loop
#         }

#         # Appel direct à l'API GPU
#         response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=params)
#         response.raise_for_status()
#         response_data = response.json()

#         # Stocker les infos minimales
#         process_info = {
#             "id": process_id,
#             "config": config.dict(),
#             "status": response_data,
#             "started_at": time.time(),
#             "gpu_status": "running",
#             "client_ip": request.client.host,
#             "last_updated": time.time(),
#             "view_url": response_data.get("view_url")
#         }

#         processes[process_id] = process_info
#         write_youtube_processes(processes)

#         # Surveillance en arrière-plan
#         background_tasks.add_task(monitor_youtube_process, process_id)

#         return {
#             "process_id": process_id,
#             "status": "started",
#             "rtsp_stream": response_data.get("rtsp_stream"),
#             "http_stream": response_data.get("http_stream"),
#             "view_url": response_data.get("view_url"),
#             "config": config.dict()
#         }

#     except requests.RequestException as e:
#         logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#         raise HTTPException(status_code=503, detail=f"Impossible de se connecter à la machine GPU: {str(e)}")
#     except Exception as e:
#         logger.error(f"Erreur inattendue: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

# @router.get("/api/youtube/status/{process_id}")
# async def get_youtube_process_status(process_id: str):
#     """Récupère le statut d'un processus YouTube spécifique."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     # Essayer de récupérer le statut frais depuis l'API GPU
#     try:
#         response = requests.get(f"{GPU_API_BASE_URL}/api/status")
#         if response.status_code == 200:
#             gpu_status = response.json()
#             # Vérifier que c'est bien notre processus
#             if gpu_status.get("url") == process_info["config"]["url"]:
#                 process_info["status"] = gpu_status
#                 process_info["last_updated"] = time.time()
#                 process_info["view_url"] = gpu_status.get("view_url")  # Mettre à jour l'URL de visualisation
#                 # Mise à jour du statut GPU
#                 if not gpu_status.get("active", False) and process_info["gpu_status"] == "running":
#                     process_info["gpu_status"] = "finished"
#                     process_info["finished_at"] = time.time()
#                 # Sauvegarde des changements
#                 processes[process_id] = process_info
#                 write_youtube_processes(processes)
#     except requests.RequestException as e:
#         logger.warning(f"Impossible de mettre à jour le statut depuis l'API GPU: {str(e)}")
#         # On continue avec le dernier statut connu
    
#     return process_info

# @router.delete("/api/youtube/stop/{process_id}")
# async def stop_youtube_process(process_id: str):
#     """Arrête un processus YouTube spécifique."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     try:
#         # Demander à l'API GPU d'arrêter le processus
#         response = requests.get(f"{GPU_API_BASE_URL}/api/stop")
        
#         if response.status_code != 200:
#             logger.error(f"Échec de l'arrêt du processus: {response.text}")
#             raise HTTPException(status_code=response.status_code, 
#                                detail=f"Erreur lors de l'arrêt du processus: {response.json().get('error', 'Erreur inconnue')}")
        
#         # Mettre à jour le statut
#         process_info["gpu_status"] = "stopped"
#         process_info["stopped_at"] = time.time()
#         process_info["status"] = response.json()
#         processes[process_id] = process_info
        
#         # Sauvegarder les changements
#         write_youtube_processes(processes)
        
#         return {
#             "process_id": process_id,
#             "status": "stopped",
#             "message": response.json().get("status", "Processus arrêté")
#         }
        
#     except requests.RequestException as e:
#         logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#         raise HTTPException(status_code=503, 
#                            detail=f"Impossible de se connecter à la machine GPU: {str(e)}")

# @router.post("/api/youtube/processes")
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
#             raise HTTPException(status_code=500, detail="GPU processing failed - no view_url returned")

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
#         ffmpeg_process = subprocess.Popen(command, stderr=subprocess.PIPE)

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

#         logger.info(f"Réponse GPU: {gpu_data}")
#         return {
#             "process_id": process_id,
#             "stream_id": stream_id,
#             "hls_url": conversion_info["hls_url"],
#             "status": "processing",
#             "title": youtube_info.get("title", "YouTube Stream"),
#             "is_live": youtube_info.get("is_live", False),
#             "gpu_status": gpu_data
#         }
    

#     except Exception as e:
#         logger.error(f"Erreur dans /api/youtube/process: {str(e)}")
#         raise

#     except requests.RequestException as e:
#         logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#         raise HTTPException(status_code=502, detail=f"Erreur de l'API GPU: {str(e)}")
#     except Exception as e:
#         logger.error(f"Erreur lors du traitement YouTube: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur de conversion: {str(e)}")

# # Nouvelle route pour accéder directement à la visualisation d'un processus par son ID
# @router.get("/api/youtube/view/{process_id}")
# async def view_youtube_process(process_id: str):
#     """Redirige vers la visualisation directe d'un processus YouTube spécifique."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     # Si le processus est actif, vérifier le statut sur la machine GPU
#     if process_info["gpu_status"] == "running":
#         try:
#             response = requests.get(f"{GPU_API_BASE_URL}/api/status")
#             if response.status_code == 200:
#                 gpu_status = response.json()
                
#                 # Si ce n'est pas notre processus actuel, démarrer avec l'URL correcte
#                 if gpu_status.get("url") != process_info["config"]["url"]:
#                     # Redémarrer le processus avec la bonne URL
#                     params = {
#                         "url": process_info["config"]["url"],
#                         "detect": process_info["config"]["detect"],
#                         "q": process_info["config"]["quality"],
#                         "loop": process_info["config"]["loop"]
#                     }
#                     restart_response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=params)
#                     if restart_response.status_code == 200:
#                         gpu_status = restart_response.json()
#         except requests.RequestException as e:
#             logger.warning(f"Impossible de vérifier le statut sur la machine GPU: {str(e)}")
    
#     # Accéder à l'URL de visualisation
#     view_url = process_info.get("view_url") or f"{GPU_API_BASE_URL}/api/view"
    
#     # Rediriger vers l'URL de visualisation
#     return RedirectResponse(url=view_url)

# # Nouvelle route pour démarrer/reprendre un processus existant
# @router.get("/api/youtube/resume/{process_id}")
# async def resume_youtube_process(process_id: str, background_tasks: BackgroundTasks):
#     """Redémarre un processus existant sur la machine GPU."""
#     # Lire les processus
#     processes = read_youtube_processes()
    
#     if process_id not in processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     process_info = processes[process_id]
    
#     try:
#         # Récupérer la configuration originale
#         config = process_info["config"]
        
#         # Préparer les paramètres pour l'API GPU
#         params = {
#             "url": config["url"],
#             "detect": config["detect"],
#             "q": config["quality"],
#             "loop": config["loop"]
#         }
        
#         # Appel à l'API GPU pour démarrer/reprendre le processus
#         response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=params)
#         response.raise_for_status()
        
#         response_data = response.json()
        
#         # Mise à jour du statut
#         process_info["gpu_status"] = "running"
#         process_info["resumed_at"] = time.time()
#         process_info["status"] = response_data
#         process_info["last_updated"] = time.time()
#         process_info["view_url"] = response_data.get("view_url")
        
#         # Sauvegarder les changements
#         processes[process_id] = process_info
#         write_youtube_processes(processes)
        
#         # Redémarrer la surveillance
#         background_tasks.add_task(monitor_youtube_process, process_id)
        
#         return {
#             "process_id": process_id,
#             "status": "resumed",
#             "title": process_info.get("title"),
#             "rtsp_stream": response_data.get("rtsp_stream"),
#             "http_stream": response_data.get("http_stream"),
#             "view_url": response_data.get("view_url")
#         }
        
#     except requests.RequestException as e:
#         logger.error(f"Erreur de connexion à l'API GPU: {str(e)}")
#         raise HTTPException(status_code=503, 
#                            detail=f"Impossible de se connecter à la machine GPU: {str(e)}")
#     except Exception as e:
#         logger.error(f"Erreur inattendue: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

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
#                     process_info["view_url"] = status_data.get("view_url")  # Mettre à jour l'URL de visualisation
                    
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

# @router.get("/api/youtube/info")
# async def get_youtube_info(url: str):
#     """Récupère des informations sur une vidéo YouTube."""
#     try:
#         import subprocess
        
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

# # Point d'entrée pour récupérer un processus par son ID YouTube
# @router.get("/api/youtube/by-youtube-id/{youtube_id}")
# async def get_process_by_youtube_id(youtube_id: str):
#     """Récupère un processus par son ID YouTube."""
#     processes = read_youtube_processes()
    
#     # Rechercher par ID YouTube
#     matching_processes = []
#     for pid, process in processes.items():
#         if process.get("youtube_id") == youtube_id:
#             matching_processes.append(process)
    
#     if not matching_processes:
#         raise HTTPException(status_code=404, detail="Aucun processus trouvé pour cet ID YouTube")
    
#     # Trier par date de début (plus récent en premier)
#     sorted_processes = sorted(
#         matching_processes, 
#         key=lambda p: float(p.get("started_at", 0)) if isinstance(p.get("started_at"), str) else p.get("started_at", 0),
#         reverse=True
#     )
    
#     return {
#         "youtube_id": youtube_id,
#         "processes": sorted_processes
#     }

# # Modification de la fonction de conversion pour enregistrer les informations
# @router.post("/api/convert-to-hls")
# async def convert_to_hls(source_url: str, title: str = None):
#     """Wrapper for process_and_convert with title support"""
#     result = await process_and_convert(source_url)
    
#     # Update with title if provided
#     if title:
#         conversions = read_hls_conversions()
#         if result["stream_id"] in conversions:
#             conversions[result["stream_id"]]["title"] = title
#             write_hls_conversion(result["stream_id"], conversions[result["stream_id"]])
    
#     return result

# # Endpoint pour servir les fichiers HLS
# @router.get("/api/hls/{filename}")
# async def get_hls_file(filename: str):
#     """Sert les fichiers HLS (.m3u8 et .ts)."""
#     file_path = os.path.join(HLS_OUTPUT_DIR, filename)
#     if os.path.exists(file_path):
#         return FileResponse(file_path)
#     raise HTTPException(status_code=404, detail="Fichier HLS non trouvé")

# # Intégration directe entre YouTube et HLS
# @router.post("/api/youtube/convert-to-hls")
# async def youtube_to_hls(url: str, quality: str = "best"):
#     """Convertit directement une vidéo YouTube en flux HLS."""
#     try:
#         # Génère un identifiant unique pour ce flux
#         stream_id = str(uuid.uuid4())
#         output_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#         os.makedirs(output_dir, exist_ok=True)
#         hls_playlist = os.path.join(output_dir, "playlist.m3u8")
        
#         # Commande pour obtenir le flux direct depuis YouTube via yt-dlp puis le convertir en HLS
#         command = [
#             "ffmpeg",
#             "-reconnect", "1",
#             "-reconnect_streamed", "1",
#             "-reconnect_delay_max", "5",
#             "-i", f"$(yt-dlp -f {quality} -g {url})",  # Obtenir l'URL directe via yt-dlp
#             "-c:v", "copy",              # Copier le codec vidéo (sans réencodage)
#             "-c:a", "aac",               # Convertir l'audio en AAC
#             "-hls_time", "4",            # Durée des segments (4s)
#             "-hls_list_size", "10",      # Nombre de segments dans la playlist
#             "-hls_flags", "delete_segments", # Supprimer les anciens segments
#             "-f", "hls",                 # Format de sortie HLS
#             hls_playlist                 # Fichier de sortie .m3u8
#         ]
        
#         # Version plus sûre qui fonctionne en deux étapes
#         try:
#             # 1. Obtenir l'URL directe
#             url_result = subprocess.run(
#                 ["yt-dlp", "-f", quality, "-g", url],
#                 capture_output=True,
#                 text=True,
#                 check=True
#             )
#             direct_url = url_result.stdout.strip()
            
#             # 2. Conversion en HLS avec FFmpeg
#             ffmpeg_command = [
#                 "ffmpeg",
#                 "-reconnect", "1",
#                 "-reconnect_streamed", "1", 
#                 "-reconnect_delay_max", "5",
#                 "-i", direct_url,
#                 "-c:v", "copy",
#                 "-c:a", "aac",
#                 "-hls_time", "4",
#                 "-hls_list_size", "10",
#                 "-hls_flags", "delete_segments",
#                 "-f", "hls",
#                 hls_playlist
#             ]
            
#             # Lancer FFmpeg en arrière-plan
#             subprocess.Popen(ffmpeg_command, stderr=subprocess.PIPE)
            
#             # Stocker les informations sur ce flux dans un fichier metadata
#             youtube_info = extract_youtube_info(url)
#             metadata = {
#                 "stream_id": stream_id,
#                 "youtube_url": url,
#                 "youtube_id": youtube_info.get("youtube_id"),
#                 "title": youtube_info.get("title"),
#                 "created_at": time.time(),
#                 "status": "running"
#             }
            
#             with open(os.path.join(output_dir, "metadata.json"), 'w') as f:
#                 json.dump(metadata, f, indent=2)
            
#             return {
#                 "stream_id": stream_id,
#                 "hls_url": f"/api/hls/{stream_id}/playlist.m3u8",
#                 "title": youtube_info.get("title"),
#                 "message": "Conversion en cours, le flux HLS sera disponible dans quelques secondes."
#             }
            
#         except subprocess.CalledProcessError as e:
#             logger.error(f"Erreur lors de l'extraction de l'URL YouTube: {e.stderr}")
#             raise HTTPException(status_code=400, 
#                                detail="Impossible d'obtenir l'URL directe depuis YouTube")
            
#     except Exception as e:
#         logger.error(f"Erreur lors de la conversion YouTube vers HLS: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))

# # Endpoint pour obtenir la liste des conversions HLS
# @router.get("/api/hls/conversions")
# async def get_hls_conversions(active_only: bool = False):
#     """Récupère la liste des conversions HLS avec leur statut."""
#     conversions = read_hls_conversions()
    
#     if active_only:
#         return {
#             k: v for k, v in conversions.items()
#             if v.get("status") in ["converting", "processing"]
#         }
    
#     return conversions

# # Endpoint pour obtenir les détails d'une conversion spécifique
# @router.get("/api/hls/conversions/{stream_id}")
# async def get_hls_conversion_details(stream_id: str):
#     """Récupère les détails d'une conversion HLS spécifique."""
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


# # Endpoint pour supprimer une conversion HLS
# @router.delete("/api/hls/conversions/{stream_id}")
# async def delete_hls_conversion(stream_id: str):
#     """Supprime une conversion HLS et ses fichiers associés."""
#     conversions = read_hls_conversions()
    
#     if stream_id not in conversions:
#         raise HTTPException(status_code=404, detail="Conversion HLS non trouvée")
    
#     # Récupérer l'information sur la conversion
#     conversion = conversions[stream_id]
    
#     # Supprimer les fichiers
#     hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#     try:
#         if os.path.exists(hls_dir):
#             import shutil
#             shutil.rmtree(hls_dir)
#     except Exception as e:
#         logger.error(f"Erreur lors de la suppression des fichiers HLS: {str(e)}")
#         # Continuer même en cas d'erreur
    
#     # Supprimer l'entrée du fichier JSON
#     del conversions[stream_id]
#     with open(HLS_CONVERSIONS_FILE, 'w') as f:
#         json.dump(conversions, f, indent=2)
    
#     return {"status": "deleted", "stream_id": stream_id}





# # ajouter par yacine 
# @router.post("/api/process-and-convert")
# async def process_and_convert(url: str, detect: str = "all", quality: str = "hd"):
#     """Process URL through GPU and convert output to HLS"""
#     try:
#         # Step 1: Send to GPU for processing
#         gpu_params = {
#             "url": url,
#             "detect": detect,
#             "q": quality,
#             "loop": False
#         }
        
#         gpu_response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=gpu_params)
#         gpu_response.raise_for_status()
#         gpu_data = gpu_response.json()
        
#         if not gpu_data.get("view_url"):
#             raise HTTPException(status_code=500, detail="GPU processing failed - no view_url returned")
        
#         # Step 2: Convert GPU output to HLS
#         stream_id = str(uuid.uuid4())
#         hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#         os.makedirs(hls_dir, exist_ok=True)
#         hls_playlist = os.path.join(hls_dir, "playlist.m3u8")
        
#         # FFmpeg command to convert GPU output to HLS
#         command = [
#             "ffmpeg",
#             "-i", gpu_data["view_url"],  # Use GPU's view_url as input
#             "-c:v", "libx264",
#             "-c:a", "aac",
#             "-hls_time", "4",
#             "-hls_list_size", "10",
#             "-hls_flags", "delete_segments",
#             "-f", "hls",
#             hls_playlist
#         ]
        
#         # Start conversion process
#         ffmpeg_process = subprocess.Popen(command, stderr=subprocess.PIPE)
        
#         # Save conversion info
#         conversion_info = {
#             "stream_id": stream_id,
#             "source_url": url,
#             "gpu_view_url": gpu_data["view_url"],
#             "hls_url": f"/api/hls/{stream_id}/playlist.m3u8",
#             "created_at": time.time(),
#             "status": "converting",
#             "ffmpeg_pid": ffmpeg_process.pid,
#             "detection_type": detect,
#             "quality": quality
#         }
        
#         write_hls_conversion(stream_id, conversion_info)
        
#         # Start monitoring
#         asyncio.create_task(monitor_hls_conversion(stream_id, ffmpeg_process))
        
#         return {
#             "stream_id": stream_id,
#             "hls_url": f"/api/hls/{stream_id}/playlist.m3u8",
#             "status": "processing",
#             "gpu_status": gpu_data
#         }
        
#     except requests.RequestException as e:
#         raise HTTPException(status_code=502, detail=f"GPU API error: {str(e)}")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")















####################################################################################################################################
########################################################## ROUTE YACINE  ###########################################################
####################################################################################################################################


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






######################### Route de Youtube URL ###############################################
# from fastapi import APIRouter, HTTPException, BackgroundTasks
# from fastapi.responses import JSONResponse, FileResponse
# from typing import Dict, Any
# from pydantic import BaseModel
# import requests
# import json
# import os
# import logging
# import time
# import asyncio
# import subprocess
# import uuid
# import re
# import glob


# # Constantes pour les chemins de fichiers
# HLS_OUTPUT_DIR = "/var/www/hls"
# YOUTUBE_PROCESSES_FILE = "streams/youtube_processes.json"

# # Configuration de l'API GPU
# GPU_API_BASE_URL = "http://192.168.1.153:8020"  # Adresse de la machine GPU

# # Création du routeur FastAPI pour YouTube
# router = APIRouter(tags=["YouTube Processing"])

# # Modèles Pydantic
# class YoutubeProcessConfig(BaseModel):
#     url: str
#     detect: str = "all"  # person,face,phone,all
#     quality: str = "hd"  # hd ou low
#     loop: bool = False

# # Configuration du logging
# logger = logging.getLogger("youtube-processing-api")

# # Fonctions utilitaires pour la gestion des données
# def read_youtube_processes():
#     if not os.path.exists(YOUTUBE_PROCESSES_FILE):
#         os.makedirs(os.path.dirname(YOUTUBE_PROCESSES_FILE), exist_ok=True)
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
#     """Amélioration de l'extraction des métadonnées YouTube"""
#     try:
#         # Obtenir plus de métadonnées avec yt-dlp
#         result = subprocess.run(
#             ["yt-dlp", "--skip-download", "--print", "%(title)s||%(id)s", url],
#             capture_output=True,
#             text=True,
#             check=True
#         )
#         title, yt_id = result.stdout.strip().split('||')
        
#         # Nettoyer le titre pour le rendre plus lisible
#         clean_title = re.sub(r'[^\w\s-]', '', title)[:100].strip()
        
#         return {
#             "youtube_id": yt_id,
#             "title": clean_title or "video_youtube",
#             "original_title": title
#         }
#     except Exception as e:
#         logger.warning(f"Erreur extraction métadonnées: {str(e)}")
#         return {
#             "youtube_id": None,
#             "title": "video_youtube"
#         }

# # Fonctions pour gérer les conversions HLS
# def read_hls_conversions():
#     HLS_CONVERSIONS_FILE = "streams/hls_conversions.json"
#     if not os.path.exists(HLS_CONVERSIONS_FILE):
#         os.makedirs(os.path.dirname(HLS_CONVERSIONS_FILE), exist_ok=True)
#         with open(HLS_CONVERSIONS_FILE, 'w') as f:
#             json.dump({}, f)
#         return {}
    
#     try:
#         with open(HLS_CONVERSIONS_FILE, 'r') as f:
#             return json.load(f)
#     except json.JSONDecodeError:
#         return {}

# def write_hls_conversion(stream_id, conversion_data):
#     HLS_CONVERSIONS_FILE = "streams/hls_conversions.json"
#     conversions = read_hls_conversions()
#     conversions[stream_id] = conversion_data
    
#     with open(HLS_CONVERSIONS_FILE, 'w') as f:
#         json.dump(conversions, f, indent=2)

# def update_hls_conversion_status(stream_id, status):
#     HLS_CONVERSIONS_FILE = "streams/hls_conversions.json"
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
#         # Capturer la sortie d'erreur
#         stdout, stderr = await process.communicate()
#         return_code = process.returncode

#         if return_code == 0:
#             update_hls_conversion_status(stream_id, "completed")
#             logger.info(f"Conversion HLS terminée avec succès pour {stream_id}")
#         else:
#             error_msg = stderr.decode() if stderr else "Erreur inconnue"
#             logger.error(f"Erreur lors de la conversion HLS pour {stream_id}, code: {return_code}, message: {error_msg}")
#             update_hls_conversion_status(stream_id, "failed")
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
#                     process_info["view_url"] = status_data.get("hls_stream")  # Adaptation à l'API GPU
                    
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

# # ROUTES API pour YouTube



# @router.get("/api/youtube/process")
# async def test_permissions():
#     try:
#         test_dir = os.path.join(HLS_OUTPUT_DIR, "test_dir")
#         os.makedirs(test_dir, exist_ok=True)
#         test_file = os.path.join(test_dir, "test.txt")
#         with open(test_file, "w") as f:
#             f.write("test")
#         os.remove(test_file)
#         os.rmdir(test_dir)
#         return {"message": "Permissions OK"}
#     except Exception as e:
#         return {"error": str(e)}



# @router.post("/api/youtube/process")
# async def youtube_process(config: YoutubeProcessConfig, background_tasks: BackgroundTasks):
#     try:
#         # Extraire les infos YouTube avant de commencer
#         youtube_info = extract_youtube_info(config.url)
#         video_title = youtube_info.get("title", "video_youtube")
        
#         # Créer un ID simplifié et sécurisé à partir du titre
#         def create_stream_id(title):
#             # Supprimer tous les caractères accentués et non-ASCII
#             import unicodedata
#             normalized = unicodedata.normalize('NFKD', title)
#             ascii_title = ''.join([c for c in normalized if ord(c) < 128])
            
#             # Garder seulement les caractères alphanumériques et underscores
#             clean_title = re.sub(r'[^\w_]', '_', ascii_title.lower())
            
#             # Limiter la longueur et ajouter un suffixe unique
#             return f"{clean_title[:50]}_{str(uuid.uuid4())[:8]}"
            
#         # Utilisez un seul stream_id cohérent pour tout le processus
#         stream_id = create_stream_id(video_title)
#         logger.info(f"ID de flux généré: {stream_id} pour '{video_title}'")
        
#         # 1. Initialisation
#         process_id = get_next_process_id()
#         logger.info(f"Démarrage processus {process_id}")

#         # 2. Démarrer le traitement sur la GPU
#         try:
#             gpu_res = requests.get(
#                 f"{GPU_API_BASE_URL}/api/start",
#                 params={
#                     "url": config.url,
#                     "detect": config.detect,
#                     "q": config.quality,
#                     "loop": str(config.loop)
#                 },
#                 timeout=10
#             )
#             gpu_res.raise_for_status()
#             gpu_data = gpu_res.json()
#         except Exception as e:
#             logger.error(f"Erreur démarrage GPU: {str(e)}")
#             raise HTTPException(502, "Erreur communication avec la GPU")

#         if not gpu_data.get("hls_stream"):
#             raise HTTPException(500, "La GPU n'a pas retourné d'URL HLS")

#         # 3. Préparer le répertoire local
#         # NE PAS redéfinir stream_id ici - utiliser la valeur déjà créée
#         hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#         os.makedirs(hls_dir, exist_ok=True)

#         # 4. Vérifier que la GPU a bien démarré
#         async def wait_for_gpu_segment():
#             for _ in range(30):  # 30 tentatives (60s max)
#                 try:
#                     status_res = requests.get(f"{GPU_API_BASE_URL}/api/status", timeout=5)
#                     if status_res.json().get("segments_generated", 0) > 0:
#                         return True
#                 except:
#                     pass
#                 await asyncio.sleep(2)
#             return False

#         if not await wait_for_gpu_segment():
#             raise HTTPException(504, "La GPU n'a pas généré de segment à temps")

#         # 5. Lancer FFmpeg en mode miroir
#         cmd = [
#             "ffmpeg",
#             "-i", f"{GPU_API_BASE_URL}/hls/stream.m3u8",
#             "-c", "copy",
#             "-f", "hls",
#             "-hls_flags", "delete_segments+append_list",
#             "-hls_segment_filename", f"{hls_dir}/segment_%03d.ts",
#             f"{hls_dir}/playlist.m3u8"
#         ]

#         ffmpeg_process = await asyncio.create_subprocess_exec(
#             *cmd,
#             stdout=asyncio.subprocess.PIPE,
#             stderr=asyncio.subprocess.PIPE
#         )

#         # 6. Vérifier que le flux local a démarré
#         async def check_local_segments():
#             for _ in range(15):  # 15 tentatives (30s max)
#                 if os.path.exists(f"{hls_dir}/segment_000.ts"):
#                     return True
#                 await asyncio.sleep(2)
#             return False

#         if not await check_local_segments():
#             ffmpeg_process.terminate()
#             raise HTTPException(500, "Échec démarrage flux local")

#         # 7. Enregistrer les métadonnées
#         youtube_info = extract_youtube_info(config.url)
#         hls_url = f"/api/hls/{stream_id}/playlist.m3u8"

#         conversion_info = {
#             "stream_id": stream_id,
#             "source_url": config.url,
#             "hls_url": hls_url,
#             "title": video_title,  # Ajout du titre
#             "status": "running",
#             "created_at": time.time()
#         }
#         write_hls_conversion(stream_id, conversion_info)

#         process_info = {
#             "id": process_id,
#             "config": config.dict(),
#             "hls_url": hls_url,
#             "started_at": time.time(),
#             "status": "running"
#         }
#         processes = read_youtube_processes()
#         processes[process_id] = process_info
#         write_youtube_processes(processes)

#         # 8. Démarrer la surveillance
#         background_tasks.add_task(monitor_hls_conversion, stream_id, ffmpeg_process)
#         background_tasks.add_task(monitor_youtube_process, process_id)

#         return {
#             "process_id": process_id,
#             "stream_id": stream_id,
#             "hls_url": hls_url,
#             "status": "running"
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Erreur inattendue: {str(e)}")
#         raise HTTPException(500, "Erreur interne du serveur")

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
#         # Adapter les paramètres à l'API GPU
#         gpu_params = {
#             "url": config.url,
#             "detect": config.detect,
#             "q": config.quality,
#             "loop": config.loop
#         }
        
#         gpu_response = requests.get(f"{GPU_API_BASE_URL}/api/start", params=gpu_params)
#         gpu_response.raise_for_status()
#         gpu_data = gpu_response.json()
        
#         # Vérifier la réponse
#         if not gpu_data.get("hls_stream"):
#             raise HTTPException(status_code=500, detail="L'API GPU n'a pas retourné d'URL de stream HLS")
        
#         # Créer un nouveau stream HLS
#         stream_id = str(uuid.uuid4())
#         hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#         os.makedirs(hls_dir, exist_ok=True)
#         logger.info(f"Created HLS directory: {hls_dir}")
#         hls_playlist = os.path.join(hls_dir, "playlist.m3u8")
        
#         # Commande FFmpeg pour relayer le flux HLS
#         command = [
#             "ffmpeg",
#             "-i", gpu_data["hls_stream"],
#             "-c", "copy",  # Simple copie sans réencodage
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
#             "gpu_hls_url": gpu_data["hls_stream"],
#             "gpu_mjpeg_url": gpu_data.get("mjpeg_stream"),
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
#             "view_url": gpu_data.get("hls_stream"),
#             "mjpeg_url": gpu_data.get("mjpeg_stream"),
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
#             "gpu_hls_url": gpu_data["hls_stream"],
#             "gpu_mjpeg_url": gpu_data.get("mjpeg_stream"),
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


# @router.get("/api/placeholder/{width}/{height}")
# async def placeholder_image(width: int, height: int):
#     """Retourne une image placeholder"""
#     # Vous pouvez soit générer une image, soit en retourner une existante
#     return FileResponse("path/to/placeholder.jpg")

# @router.get("/api/youtube/processes")
# async def get_active_processes():
#     """Retourne la liste des processus actifs"""
#     processes = read_youtube_processes()
#     return list(processes.values())

# @router.get("/api/hls/{stream_id}/playlist.m3u8")
# async def serve_hls_playlist(stream_id: str):
#     # Normalisez le stream_id pour éviter les problèmes de chemin
#     stream_id = stream_id.replace("___", "_").replace("__", "_")
#     hls_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
#     file_path = os.path.join(hls_dir, "playlist.m3u8")
    
#     print(f"Tentative de lecture HLS: {file_path}")  # Debug
    
#     if not os.path.exists(file_path):
#         print(f"Fichier non trouvé. Contenu du répertoire: {os.listdir(hls_dir) if os.path.exists(hls_dir) else 'Répertoire inexistant'}")
#         raise HTTPException(status_code=404, detail=f"Playlist introuvable pour stream {stream_id}")
    
#     return FileResponse(
#         file_path,
#         media_type="application/vnd.apple.mpegurl",
#         headers={
#             "Access-Control-Allow-Origin": "*",
#             "Cache-Control": "no-cache"
#         }
#     )



# async def wait_for_hls_segment(hls_dir: str, timeout: int = 30):
#     """Attend qu'au moins un segment HLS soit disponible."""
#     start_time = time.time()
#     segment_pattern = os.path.join(hls_dir, "segment_*.ts")
    
#     while (time.time() - start_time) < timeout:
#         if len(glob.glob(segment_pattern)) > 0:
#             return True
#         await asyncio.sleep(1)
    
#     return False

# @router.get("/api/hls/test")
# async def test_hls_access():
#     """Route de test pour vérifier l'accès aux fichiers HLS"""
#     # Listez les répertoires dans HLS_OUTPUT_DIR
#     if os.path.exists(HLS_OUTPUT_DIR):
#         dirs = os.listdir(HLS_OUTPUT_DIR)
#         return {"message": "HLS directory exists", "files": dirs}
#     else:
#         return {"message": "HLS directory does not exist", "path": HLS_OUTPUT_DIR}






################################# Marche Bien  ########################################
# get_video_test.py

# import os
# import requests
# import logging
# import time
# import hashlib
# from fastapi import APIRouter, Query, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# from pathlib import Path
# from typing import Optional

# # Configuration
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# router = APIRouter(tags=["YouTube Converter"])

# GPU_API1_URL = "http://192.168.1.153:8022/api/start"
# GPU_API2_BASE_URL = "http://192.168.1.153:8020"
# LOCAL_HLS_BASE_DIR = "/var/www/hls"
# MIN_SEGMENTS = 2  # Nombre minimum de segments avant de commencer le transfert
# MAX_WAIT_INITIAL = 60  # Temps max d'attente pour les premiers segments
# POLL_INTERVAL = 2  # Intervalle de vérification




# def get_video_dir(youtube_url: str, output_name: Optional[str] = None) -> str:
#     """Crée un nom de dossier basé sur l'URL YouTube ou un nom spécifié"""
#     if output_name:
#         return os.path.join(LOCAL_HLS_BASE_DIR, output_name)
#     url_hash = hashlib.md5(youtube_url.encode()).hexdigest()[:8]
#     return os.path.join(LOCAL_HLS_BASE_DIR, f"video_{url_hash}")

# def clean_video_dir(youtube_url: str, output_name: Optional[str] = None):
#     """Nettoie le répertoire HLS pour une vidéo spécifique"""
#     video_dir = get_video_dir(youtube_url, output_name)
#     if os.path.exists(video_dir):
#         for f in os.listdir(video_dir):
#             if f.endswith(('.ts', '.m3u8')):
#                 os.remove(os.path.join(video_dir, f))

# def ensure_video_dir(youtube_url: str, output_name: Optional[str] = None):
#     """S'assure que le dossier de la vidéo existe"""
#     video_dir = get_video_dir(youtube_url, output_name)
#     os.makedirs(video_dir, exist_ok=True)
#     return video_dir

# def wait_for_initial_segments(youtube_url: str, output_name: Optional[str] = None):
#     """Attend que les premiers segments soient disponibles et validés sur la GPU"""
#     start_time = time.time()
#     MAX_WAIT_INITIAL = 120  # 2 minutes maximum d'attente
#     MIN_SEGMENTS_REQUIRED = 2  # Minimum 2 segments avant de continuer
    
#     video_dir = get_video_dir(youtube_url, output_name)
#     logger.info(f"Attente des premiers segments HLS (minimum {MIN_SEGMENTS_REQUIRED}) dans {video_dir}...")
    
#     while time.time() - start_time < MAX_WAIT_INITIAL:
#         try:
#             # Vérifier le statut de l'API GPU
#             status = requests.get(f"{GPU_API2_BASE_URL}/api/status", timeout=5).json()
#             current_count = status.get("segment_count", 0)
            
#             # Vérifier aussi si les fichiers existent localement sur la GPU
#             playlist_url = f"{GPU_API2_BASE_URL}/hls/playlist.m3u8"
#             playlist_response = requests.get(playlist_url, timeout=5)
            
#             if playlist_response.status_code == 200:
#                 segments = [line.strip() for line in playlist_response.text.split('\n') 
#                           if line.endswith('.ts') and not line.startswith('#')]
#                 current_count = max(current_count, len(segments))
            
#             logger.info(f"Segments détectés: {current_count}/{MIN_SEGMENTS_REQUIRED} (temps écoulé: {int(time.time() - start_time)}s)")
            
#             if current_count >= MIN_SEGMENTS_REQUIRED:
#                 logger.info(f"Segments minimum atteints: {current_count} segments disponibles")
#                 return True
                
#         except requests.RequestException as e:
#             logger.warning(f"Erreur lors de la vérification des segments: {str(e)}")
            
#         time.sleep(POLL_INTERVAL)
    
#     logger.error(f"Timeout après {MAX_WAIT_INITIAL}s d'attente pour les segments initiaux")
#     return False

# def stream_hls_from_gpu(youtube_url: str, output_name: Optional[str] = None):
#     """Stream les segments depuis la GPU au fur et à mesure avec gestion d'erreurs améliorée"""
#     video_dir = ensure_video_dir(youtube_url, output_name)
#     processed_segments = set()
#     consecutive_errors = 0
#     max_consecutive_errors = 5
#     last_segment_time = time.time()
#     max_idle_time = 60  # 1 minute sans nouveau segment avant timeout
    
#     logger.info(f"Démarrage du transfert de segments vers {video_dir}")
    
#     try:
#         # Télécharger la playlist initiale
#         playlist_url = f"{GPU_API2_BASE_URL}/hls/playlist.m3u8"
#         playlist_local = os.path.join(video_dir, "playlist.m3u8")
        
#         while True:
#             try:
#                 # Récupérer la playlist mise à jour
#                 response = requests.get(playlist_url, timeout=10)
#                 response.raise_for_status()
                
#                 # Sauvegarder la playlist
#                 with open(playlist_local, 'wb') as f:
#                     f.write(response.content)
                
#                 # Analyser la playlist pour trouver les segments
#                 segments = [line.strip() for line in response.text.split('\n') 
#                            if line.endswith('.ts') and not line.startswith('#')]
                
#                 new_segments = [seg for seg in segments if seg not in processed_segments]
                
#                 if new_segments:
#                     logger.info(f"Nouveaux segments à transférer: {len(new_segments)}")
                
#                 # Télécharger les nouveaux segments
#                 for seg in new_segments:
#                     seg_url = f"{GPU_API2_BASE_URL}/hls/{seg}"
#                     seg_response = requests.get(seg_url, timeout=15)
#                     seg_response.raise_for_status()
                    
#                     seg_path = os.path.join(video_dir, seg)
#                     with open(seg_path, 'wb') as f:
#                         f.write(seg_response.content)
                    
#                     processed_segments.add(seg)
#                     last_segment_time = time.time()
#                     logger.debug(f"Segment transféré: {seg}")
                
#                 # Réinitialiser le compteur d'erreurs
#                 consecutive_errors = 0
                
#                 # Vérifier si on est inactif depuis trop longtemps
#                 idle_time = time.time() - last_segment_time
#                 if idle_time > max_idle_time:
#                     logger.warning(f"Aucun nouveau segment depuis {idle_time:.1f}s - arrêt du transfert")
#                     break
                
#                 # Vérifier si le flux est toujours actif sur la GPU
#                 status = requests.get(f"{GPU_API2_BASE_URL}/api/status", timeout=5).json()
#                 if not status.get('active', False):
#                     logger.info("Le flux n'est plus actif sur la GPU - arrêt du transfert")
#                     break
                
#             except requests.RequestException as e:
#                 consecutive_errors += 1
#                 logger.warning(f"Erreur de transfert ({consecutive_errors}/{max_consecutive_errors}): {str(e)}")
                
#                 if consecutive_errors >= max_consecutive_errors:
#                     logger.error("Trop d'erreurs consécutives - arrêt du transfert")
#                     break
                
#             time.sleep(POLL_INTERVAL)
            
#         logger.info(f"Transfert terminé. Total segments: {len(processed_segments)}")
        
#     except Exception as e:
#         logger.error(f"Erreur critique dans le stream: {str(e)}", exc_info=True)

# @router.get("/api/start")
# async def start_stream(
#     youtube_url: str = Query(...),
#     clean_start: bool = Query(True),
#     output_name: Optional[str] = Query(None)
# ):
#     """Démarre le processus complet de conversion"""
#     try:
#         # Nettoyage si demandé
#         if clean_start:
#             clean_video_dir(youtube_url, output_name)
        
#         # Démarrer le flux sur la première API (YouTube vers RTSP)
#         api1_response = requests.get(
#             f"{GPU_API1_URL}?url={youtube_url}",
#             timeout=30
#         )
#         api1_response.raise_for_status()
#         logger.info(f"API1 démarrée: {api1_response.json()}")
        
#         # Attendre que les premiers segments soient disponibles
#         if not wait_for_initial_segments(youtube_url, output_name):
#             raise HTTPException(
#                 status_code=504,
#                 detail="Timeout en attendant les segments initiaux"
#             )
        
#         # Démarrer le transfert des segments en arrière-plan
#         video_dir = ensure_video_dir(youtube_url, output_name)
        
#         # Lancer le streaming des segments dans un thread séparé
#         import threading
#         transfer_thread = threading.Thread(
#             target=stream_hls_from_gpu,
#             args=(youtube_url, output_name),
#             daemon=True
#         )
#         transfer_thread.start()
        
#         return JSONResponse({
#             "status": "stream_started",
#             "video_dir": os.path.basename(video_dir),
#             "hls_url": f"/api/hls/{os.path.basename(video_dir)}/playlist.m3u8",
#             "message": "Le transfert des segments a commencé"
#         })
        
#     except requests.exceptions.RequestException as e:
#         logger.error(f"Erreur API GPU: {str(e)}")
#         raise HTTPException(
#             status_code=502,
#             detail=f"Erreur de communication avec l'API GPU: {str(e)}"
#         )
#     except Exception as e:
#         logger.error(f"Erreur inattendue: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur inattendue: {str(e)}"
#         )


# @router.get("/api/stop")
# async def stop_gpu_streams():
#     """Arrête les flux sur les deux API de la machine GPU"""
#     try:
#         # Arrêter l'API 2 (RTSP vers HLS)
#         api2_response = requests.get(
#             f"{GPU_API2_BASE_URL}/api/stop",
#             timeout=5
#         )
#         logger.info(f"API 2 arrêtée: {api2_response.json()}")

#         # Arrêter l'API 1 (YouTube vers RTSP)
#         api1_response = requests.get(
#             f"{GPU_API1_URL.replace('/start', '/stop')}",
#             timeout=5
#         )
#         logger.info(f"API 1 arrêtée: {api1_response.json()}")

#         return JSONResponse({
#             "status": "GPU streams stopped",
#             "api1_status": api1_response.json(),
#             "api2_status": api2_response.json()
#         })
        
#     except requests.exceptions.RequestException as e:
#         logger.error(f"Erreur lors de l'arrêt des API GPU: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur lors de l'arrêt des API GPU: {str(e)}"
#         )


# @router.get("/api/hls/{video_dir}/{filename}")
# async def serve_hls_file(video_dir: str, filename: str):
#     """Servir les fichiers HLS"""
#     file_path = os.path.join(LOCAL_HLS_BASE_DIR, video_dir, filename)
#     if os.path.exists(file_path):
#         return FileResponse(file_path)
#     raise HTTPException(404, detail="Fichier non trouvé")


# @router.get("/api/status")
# async def get_status(
#     youtube_url: str = Query(...),
#     output_name: Optional[str] = Query(None)
# ):
#     """Statut actuel du streaming"""
#     try:
#         video_dir = get_video_dir(youtube_url, output_name)
#         local_files = {
#             "segments": sorted([
#                 f for f in os.listdir(video_dir) 
#                 if f.endswith('.ts')
#             ], key=lambda x: int(x.split('_')[1].split('.')[0])),
#             "playlist_exists": os.path.exists(f"{video_dir}/playlist.m3u8")
#         }
        
#         gpu_status = requests.get(f"{GPU_API2_BASE_URL}/api/status", timeout=5).json()
        
#         return JSONResponse({
#             "local": local_files,
#             "gpu": gpu_status,
#             "stream_active": True
#         })
#     except Exception as e:
#         raise HTTPException(500, detail=str(e))
    

# @router.get("/api/playlists")
# async def list_all_playlists():
#     """Liste toutes les playlists HLS disponibles"""
#     try:
#         playlists = []
        
#         # Parcourir tous les dossiers dans le répertoire HLS
#         for video_dir in os.listdir(LOCAL_HLS_BASE_DIR):
#             dir_path = os.path.join(LOCAL_HLS_BASE_DIR, video_dir)
#             playlist_path = os.path.join(dir_path, "playlist.m3u8")
            
#             # Vérifier si c'est un dossier avec une playlist valide
#             if os.path.isdir(dir_path) and os.path.exists(playlist_path):
#                 # Compter les segments TS
#                 ts_files = [f for f in os.listdir(dir_path) if f.endswith('.ts')]
                
#                 playlists.append({
#                     "name": video_dir,
#                     "segment_count": len(ts_files),
#                     "playlist_url": f"/api/hls/{video_dir}/playlist.m3u8",
#                     "last_modified": os.path.getmtime(playlist_path)
#                 })
        
#         # Trier par date de modification (du plus récent au plus ancien)
#         playlists.sort(key=lambda x: x["last_modified"], reverse=True)
        
#         return JSONResponse({
#             "count": len(playlists),
#             "playlists": playlists
#         })
        
#     except Exception as e:
#         logger.error(f"Erreur lors de la liste des playlists: {str(e)}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur lors de la récupération des playlists: {str(e)}"
#         )





######################################## test pour le code api.py machine gpu #################################
# get_video_test.py - Version modifiée pour conserver tous les segments


# import os
# import subprocess
# import uuid
# import shutil
# from fastapi import  HTTPException, Query, APIRouter
# from fastapi.responses import JSONResponse, HTMLResponse
# import requests
# import logging
# from typing import Optional
# import time
# import asyncio
# from pathlib import Path
# import threading

# router = APIRouter(tags=["RTSP to HLS Converter"])

# # Configuration
# GPU_API_URL = "http://192.168.1.153:8020"  # Remplacez par l'IP de votre machine GPU
# HLS_OUTPUT_DIR = "/var/www/hls" 
# RTSP_SOURCE = "rtsp://192.168.1.153:8554/detection"  # Remplacez par l'IP de votre machine GPU


# logger = logging.getLogger(__name__)
# # Dictionnaire pour suivre les processus FFmpeg en cours
# active_processes = {}



# def check_rtsp_stream(rtsp_url, timeout=5):
#     """Vérifie si le flux RTSP est disponible avec des logs détaillés"""
#     try:
#         probe_cmd = [
#             "ffprobe",
#             "-v", "error",
#             "-timeout", str(timeout * 1000000),  # en microsecondes
#             "-i", rtsp_url,
#             "-print_format", "json",
#             "-show_streams"
#         ]
#         result = subprocess.run(
#             probe_cmd,
#             check=True,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             text=True
#         )
        
#         logger.info(f"RTSP stream check successful: {rtsp_url}")
#         logger.debug(f"FFprobe output: {result.stdout}")
#         return True
#     except subprocess.CalledProcessError as e:
#         logger.error(f"RTSP stream check failed: {rtsp_url}")
#         logger.error(f"FFprobe error output: {e.stderr}")
#         return False
#     except Exception as e:
#         logger.error(f"Unexpected error checking RTSP stream: {str(e)}")
#         return False


# @router.get("/api/start")
# async def start_stream(
#     youtube_url: str = Query(..., description="URL YouTube à traiter"),
#     username: str = Query(..., description="Nom d'utilisateur pour le dossier HLS"),
#     detect: str = Query("all", description="Objets à détecter (person,face,phone,all)"),
#     quality: str = Query("hd", description="Qualité: hd ou low"),
#     loop: bool = Query(False, description="Boucler la vidéo normale")
# ):
#     try:
#         logger.info(f"Démarrage du stream pour URL: {youtube_url}, utilisateur: {username}")

#         # 1. Démarrer le traitement sur la machine GPU
#         logger.debug(f"Envoi de la requête à {GPU_API_URL}/api/start")
#         gpu_response = requests.get(
#             f"{GPU_API_URL}/api/start",
#             params={
#                 "url": youtube_url,
#                 "detect": detect,
#                 "q": quality,
#                 "loop": loop
#             },
#             timeout=10
#         )
#         gpu_response.raise_for_status()
#         logger.info(f"Réponse GPU: {gpu_response.json()}")

#         # 2. Attendre que le flux RTSP soit disponible
#         logger.debug(f"Vérification du flux RTSP: {RTSP_SOURCE}")
#         for _ in range(10):  # Attendre jusqu'à 20 secondes
#             if check_rtsp_stream(RTSP_SOURCE):
#                 logger.info("Flux RTSP disponible")
#                 break
#             logger.info("En attente du flux RTSP...")
#             time.sleep(2)
#         else:
#             raise HTTPException(status_code=500, detail="Flux RTSP non disponible après 20 secondes")

#         # 3. Créer le répertoire HLS
#         user_dir = os.path.join(HLS_OUTPUT_DIR, username)
#         os.makedirs(user_dir, exist_ok=True)
        
#         # Nettoyage du répertoire
#         for f in os.listdir(user_dir):
#             file_path = os.path.join(user_dir, f)
#             try:
#                 if os.path.isfile(file_path):
#                     os.unlink(file_path)
#             except Exception as e:
#                 logger.error(f"Erreur suppression fichier {file_path}: {e}")

#         # 4. Démarrer FFmpeg
#         playlist_path = os.path.join(user_dir, "stream.m3u8")
#         # ffmpeg_cmd = [
#         #     "ffmpeg",
#         #     "-rtsp_transport", "tcp",
#         #     "-i", RTSP_SOURCE,
#         #     "-c:v", "libx264",
#         #     "-c:a", "aac",
#         #     "-hls_time", "2",
#         #     "-hls_list_size", "0",
#         #     "-hls_flags", "omit_endlist",
#         #     "-force_key_frames", "expr:gte(t,n_forced*4)",
#         #     "-hls_segment_filename", os.path.join(user_dir, "segment_%03d.ts"),
#         #     "-start_number", "0",
#         #     "-reset_timestamps", "1",
#         #     "-f", "hls",
#         #     playlist_path
#         # ]

#         ffmpeg_cmd = [
#             "ffmpeg",
#             "-rtsp_transport", "tcp",
#             "-i", RTSP_SOURCE,
#             "-c:v", "libx264",
#             "-c:a", "aac",
#             "-hls_time", "2",                         # Durée de chaque segment .ts
#             "-hls_list_size", "0",                   # 0 = playlist infinie (ne supprime pas les anciens segments)
#             "-hls_flags", "append_list",             # Important : ne PAS utiliser delete_segments
#             "-force_key_frames", "expr:gte(t,n_forced*4)",  # Bon pour les seek
#             "-hls_segment_filename", os.path.join(user_dir, "segment_%03d.ts"),
#             "-start_number", "0",
#             "-reset_timestamps", "1",
#             "-f", "hls",
#             playlist_path
#         ]

#         process = subprocess.Popen(
#             ffmpeg_cmd, 
#             stderr=subprocess.PIPE, 
#             stdout=subprocess.PIPE,
#             universal_newlines=True
#         )
        
#         # Ajouter le logging des sorties FFmpeg
#         def log_stream(stream, logger):
#             for line in stream:
#                 logger.debug(f"FFmpeg: {line.strip()}")
        
#         threading.Thread(
#             target=log_stream,
#             args=(process.stderr, logger),
#             daemon=True
#         ).start()
        
#         logger.debug(f"Commande FFmpeg: {' '.join(ffmpeg_cmd)}")
#         process = subprocess.Popen(ffmpeg_cmd, stderr=subprocess.PIPE, universal_newlines=True)
#         process_id = str(uuid.uuid4())
#         active_processes[process_id] = {
#             "process": process,
#             "username": username,
#             "youtube_url": youtube_url
#         }

#         return JSONResponse({
#             "status": "Stream démarré",
#             "hls_playlist": f"/api/hls/{username}/stream.m3u8",
#             "process_id": process_id,
#             "gpu_status": gpu_response.json()
#         })

#     except requests.RequestException as e:
#         logger.error(f"Erreur communication avec API GPU: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur communication avec API GPU: {str(e)}")
#     except Exception as e:
#         logger.error(f"Erreur démarrage stream: {str(e)}")
#         raise HTTPException(status_code=500, detail=f"Erreur démarrage stream: {str(e)}")

# @router.get("/api/stop")
# async def stop_stream(process_id: str = Query(..., description="ID du processus à arrêter")):
#     if process_id not in active_processes:
#         raise HTTPException(status_code=404, detail="Processus non trouvé")
    
#     try:
#         # 1. Arrêter FFmpeg
#         process_info = active_processes[process_id]
#         process_info["process"].terminate()
        
#         # 2. Arrêter le traitement sur la machine GPU
#         gpu_response = requests.get(f"{GPU_API_URL}/api/stop")
#         gpu_response.raise_for_status()
        
#         # 3. Nettoyer
#         del active_processes[process_id]
        
#         return JSONResponse({
#             "status": "Stream arrêté",
#             "gpu_status": gpu_response.json()
#         })
#     except requests.RequestException as e:
#         raise HTTPException(status_code=500, detail=f"Erreur communication avec API GPU: {str(e)}")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur arrêt stream: {str(e)}")

# @router.get("/api/status")
# async def get_status(process_id: Optional[str] = Query(None, description="ID du processus")):
#     try:
#         # Récupérer le statut de la machine GPU
#         gpu_response = requests.get(f"{GPU_API_URL}/api/status")
#         gpu_response.raise_for_status()
        
#         response = {
#             "gpu_status": gpu_response.json(),
#             "active_processes": {}
#         }
        
#         if process_id:
#             if process_id in active_processes:
#                 process_info = active_processes[process_id]
#                 response["active_processes"][process_id] = {
#                     "username": process_info["username"],
#                     "youtube_url": process_info["youtube_url"],
#                     "running": process_info["process"].poll() is None
#                 }
#             else:
#                 raise HTTPException(status_code=404, detail="Processus non trouvé")
#         else:
#             for pid, info in active_processes.items():
#                 response["active_processes"][pid] = {
#                     "username": info["username"],
#                     "youtube_url": info["youtube_url"],
#                     "running": info["process"].poll() is None
#                 }
        
#         return JSONResponse(response)
#     except requests.RequestException as e:
#         raise HTTPException(status_code=500, detail=f"Erreur communication avec API GPU: {str(e)}")


# @router.get("/api/playlists")
# async def list_all_playlists():
#     try:
#         playlists = []
#         hls_dir = Path(HLS_OUTPUT_DIR)
        
#         for video_dir in hls_dir.iterdir():
#             if not video_dir.is_dir():
#                 continue
                
#             # Chercher tous les fichiers .m3u8 dans le dossier
#             for playlist_file in video_dir.glob("*.m3u8"):
#                 try:
#                     ts_files = list(video_dir.glob("*.ts"))
#                     playlists.append({
#                         "name": video_dir.name,
#                         "segment_count": len(ts_files),
#                         "playlist_url": f"/hls/{video_dir.name}/{playlist_file.name}",
#                         "last_modified": playlist_file.stat().st_mtime,
#                         "directory": video_dir.name
#                     })
#                     break  # On prend le premier fichier m3u8 trouvé
#                 except Exception as e:
#                     logger.warning(f"Erreur avec {playlist_file}: {str(e)}")
#                     continue
        
#         playlists.sort(key=lambda x: x["last_modified"], reverse=True)
        
#         return JSONResponse({
#             "count": len(playlists),
#             "playlists": playlists
#         })
        
#     except Exception as e:
#         logger.error(f"Erreur liste playlists: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=str(e))




########################################### la version finale pour enregistrer url youtube to hls ######################


import os
import subprocess
import uuid
import shutil
from fastapi import  HTTPException, Query, APIRouter
from fastapi.responses import JSONResponse, HTMLResponse
import requests
import logging
from typing import Optional
import time
import asyncio
from pathlib import Path
import threading
import json


router = APIRouter(tags=["RTSP to HLS Converter"])

# Configuration
GPU_API_URL = "http://192.168.1.153:8020"  # Remplacez par l'IP de votre machine GPU
HLS_OUTPUT_DIR = "/var/www/hls" 
RTSP_SOURCE = "rtsp://192.168.1.153:8554/detection"  # Remplacez par l'IP de votre machine GPU


logger = logging.getLogger(__name__)
# Dictionnaire pour suivre les processus FFmpeg en cours
active_processes = {}



def check_rtsp_stream(rtsp_url):
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=codec_name,width,height,pix_fmt",
            "-of", "json",
            rtsp_url
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            logger.error(f"FFprobe error: {result.stderr}")
            return False
        
        info = json.loads(result.stdout)
        streams = info.get('streams', [])
        if not streams:
            logger.error("No video streams found")
            return False
            
        logger.info(f"Stream info: {streams[0]}")
        return True
    except Exception as e:
        logger.error(f"RTSP check exception: {str(e)}")
        return False


@router.get("/api/start")
async def start_stream(
    youtube_url: str = Query(..., description="URL YouTube à traiter"),
    username: str = Query(..., description="Nom d'utilisateur pour le dossier HLS"),
    detect: str = Query("all", description="Objets à détecter (person,face,phone,all)"),
    quality: str = Query("hd", description="Qualité: hd ou low"),
    loop: bool = Query(False, description="Boucler la vidéo normale")
):
    
    username = username.replace(" ", "_")

    try:
        logger.info(f"Démarrage du stream pour URL: {youtube_url}, utilisateur: {username}")

        # 1. Démarrer le traitement sur la machine GPU
        logger.debug(f"Envoi de la requête à {GPU_API_URL}/api/start")
        gpu_response = requests.get(
            f"{GPU_API_URL}/api/start",
            params={
                "url": youtube_url,
                "detect": detect,
                "q": quality,
                "loop": loop
            },
            timeout=10
        )
        gpu_response.raise_for_status()
        gpu_data = gpu_response.json()
        logger.info(f"Réponse GPU: {gpu_data}")

        # Déterminer le type de vidéo
        video_type = gpu_data.get('video_type', 'normal')
        
        # 2. Attendre que le flux RTSP soit disponible
        logger.debug(f"Vérification du flux RTSP: {RTSP_SOURCE}")
        for _ in range(30):  # Attendre jusqu'à 20 secondes
            if check_rtsp_stream(RTSP_SOURCE):
                logger.info("Flux RTSP disponible")
                break
            logger.info("En attente du flux RTSP...")
            time.sleep(2)
        else:
            raise HTTPException(status_code=500, detail="Flux RTSP non disponible après 60 secondes")

        # 3. Créer le répertoire HLS en fonction du type de vidéo
        if video_type == 'live':
            user_dir = os.path.join(HLS_OUTPUT_DIR, "live_video", username)
        else:
            user_dir = os.path.join(HLS_OUTPUT_DIR, "normal_video", username)
            
        os.makedirs(user_dir, exist_ok=True)
        
        # Nettoyage du répertoire
        for f in os.listdir(user_dir):
            file_path = os.path.join(user_dir, f)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                logger.error(f"Erreur suppression fichier {file_path}: {e}")

        # 4. Démarrer FFmpeg
        playlist_path = os.path.join(user_dir, "playlist.m3u8")

        ffmpeg_cmd = [
            "ffmpeg",
            "-rtsp_transport", "tcp",
            "-i", RTSP_SOURCE,
            
            # Paramètres d'encodage (optimisés mais compatibles)
            "-c:v", "libx264",
            "-preset", "fast",         # Un peu moins agressif que 'ultrafast' pour une meilleure qualité
            "-tune", "zerolatency",
            "-pix_fmt", "yuv420p",
            "-g", "30",               # Keyframe toutes les 30 frames (~1s à 30fps)
            
            # Configuration HLS pour balayage complet
            "-f", "hls",
            "-hls_time", "4",         # Segments de 4 secondes (bon compromis)
            "-hls_list_size", "0",    # 0 = garder TOUS les segments indéfiniment
            "-hls_flags", "independent_segments+append_list+temp_file",
            "-hls_segment_type", "mpegts",
            "-hls_allow_cache", "0",
            "-hls_segment_filename", os.path.join(user_dir, "segment_%05d.ts"),  # 5 chiffres pour les longs streams
            os.path.join(user_dir, "playlist.m3u8")
        ]
        
        process = subprocess.Popen(
            ffmpeg_cmd, 
            stderr=subprocess.PIPE, 
            stdout=subprocess.PIPE,
            universal_newlines=True
        )
        
        # Ajouter le logging des sorties FFmpeg
        def log_stream(stream, logger):
            for line in stream:
                logger.debug(f"FFmpeg: {line.strip()}")
        
        threading.Thread(
            target=log_stream,
            args=(process.stderr, logger),
            daemon=True
        ).start()
        
        process_id = str(uuid.uuid4())
        active_processes[process_id] = {
            "process": process,
            "username": username,
            "youtube_url": youtube_url,
            "video_type": video_type  # Stocker le type de vidéo pour référence
        }

        return JSONResponse({
            "status": "Stream démarré",
            "hls_playlist": f"/api/hls/{'live_video' if video_type == 'live' else 'normal_video'}/{username}/playlist.m3u8",
            "process_id": process_id,
            "gpu_status": gpu_data,
            "video_type": video_type
        })

    except requests.RequestException as e:
        logger.error(f"Erreur communication avec API GPU: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur communication avec API GPU: {str(e)}")
    except Exception as e:
        logger.error(f"Erreur démarrage stream: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur démarrage stream: {str(e)}")

@router.get("/api/stop")
async def stop_stream(
    process_id: str = Query(None, description="ID du processus à arrêter (optionnel)"),
    username: str = Query(None, description="Nom d'utilisateur à arrêter (optionnel)"),
    stop_all: bool = Query(False, description="Arrêter tous les streams (optionnel)")
):
    try:
        # 1. D'abord arrêter le traitement sur la machine GPU
        gpu_response = requests.get(f"{GPU_API_URL}/api/stop")
        gpu_response.raise_for_status()
        
        stopped_processes = []
        
        # 2. Ensuite arrêter les processus FFmpeg locaux selon les paramètres
        if stop_all:
            # Arrêter tous les processus
            for pid, process_info in list(active_processes.items()):
                try:
                    process_info["process"].terminate()
                    stopped_processes.append({
                        "process_id": pid,
                        "username": process_info["username"]
                    })
                    del active_processes[pid]
                except Exception as e:
                    logger.error(f"Erreur arrêt processus {pid}: {str(e)}")
        elif process_id:
            # Arrêter un processus spécifique
            if process_id in active_processes:
                try:
                    active_processes[process_id]["process"].terminate()
                    stopped_processes.append({
                        "process_id": process_id,
                        "username": active_processes[process_id]["username"]
                    })
                    del active_processes[process_id]
                except Exception as e:
                    logger.error(f"Erreur arrêt processus {process_id}: {str(e)}")
            else:
                raise HTTPException(status_code=404, detail="Processus non trouvé")
        elif username:
            # Arrêter tous les processus pour un utilisateur donné
            for pid, process_info in list(active_processes.items()):
                if process_info["username"] == username:
                    try:
                        process_info["process"].terminate()
                        stopped_processes.append({
                            "process_id": pid,
                            "username": username
                        })
                        del active_processes[pid]
                    except Exception as e:
                        logger.error(f"Erreur arrêt processus {pid}: {str(e)}")
        
        return JSONResponse({
            "status": "Stream(s) arrêté(s)",
            "stopped_processes": stopped_processes,
            "gpu_status": gpu_response.json()
        })
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Erreur communication avec API GPU: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur arrêt stream: {str(e)}")

@router.get("/api/status")
async def get_status(process_id: Optional[str] = Query(None, description="ID du processus")):
    try:
        # Récupérer le statut de la machine GPU
        gpu_response = requests.get(f"{GPU_API_URL}/api/status")
        gpu_response.raise_for_status()
        
        response = {
            "gpu_status": gpu_response.json(),
            "active_processes": {}
        }
        
        if process_id:
            if process_id in active_processes:
                process_info = active_processes[process_id]
                response["active_processes"][process_id] = {
                    "username": process_info["username"],
                    "youtube_url": process_info["youtube_url"],
                    "running": process_info["process"].poll() is None
                }
            else:
                raise HTTPException(status_code=404, detail="Processus non trouvé")
        else:
            for pid, info in active_processes.items():
                response["active_processes"][pid] = {
                    "username": info["username"],
                    "youtube_url": info["youtube_url"],
                    "running": info["process"].poll() is None
                }
        
        return JSONResponse(response)
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Erreur communication avec API GPU: {str(e)}")


@router.get("/api/playlists")
async def list_all_playlists():
    try:
        playlists = []
        hls_dir = Path(HLS_OUTPUT_DIR)
        
        # Parcourir les dossiers live_video et normal_video
        for content_type in ["live_video", "normal_video"]:
            content_dir = hls_dir / content_type
            
            if not content_dir.exists():
                continue
                
            for video_dir in content_dir.iterdir():
                if not video_dir.is_dir():
                    continue
                    
                # Chercher tous les fichiers .m3u8 dans le dossier
                for playlist_file in video_dir.glob("*.m3u8"):
                    if playlist_file.name not in ("playlist.m3u8",):
                        continue
                    try:
                        ts_files = list(video_dir.glob("*.ts"))
                        playlists.append({
                            "name": video_dir.name,
                            "segment_count": len(ts_files),
                            "playlist_url": f"/hls/{content_type}/{video_dir.name}/{playlist_file.name}",
                            "last_modified": playlist_file.stat().st_mtime,
                            "directory": video_dir.name,
                            "content_type": content_type,  # Ajout du type de contenu
                            "playlist_type": playlist_file.name
                        })
                    except Exception as e:
                        logger.warning(f"Erreur avec {playlist_file}: {str(e)}")
                        continue
        
        playlists.sort(key=lambda x: x["last_modified"], reverse=True)
        
        return JSONResponse({
            "count": len(playlists),
            "playlists": playlists
        })
        
    except Exception as e:
        logger.error(f"Erreur liste playlists: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
