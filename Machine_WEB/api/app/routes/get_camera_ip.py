import os
import subprocess
import uuid
import shutil
from fastapi import HTTPException, Query, APIRouter
from fastapi.responses import JSONResponse, HTMLResponse
import requests
import logging
from typing import Optional
import time
import asyncio
from pathlib import Path
import threading
import json

router = APIRouter(tags=["RTSP to HLS Converter Camera IP"])

# Configuration
GPU_API_URL = "http://192.168.1.153:8050"  # URL de votre API machine GPU
HLS_BASE_DIR = "/var/www/hls"  # Répertoire de base
HLS_MAIN_DIR = "Camera_IP"     # Sous-répertoire principal pour toutes les caméras
HLS_OUTPUT_DIR = os.path.join(HLS_BASE_DIR, HLS_MAIN_DIR)  # Chemin complet
GPU_RTSP_OUTPUT = "rtsp://192.168.1.153:8556/detection"


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

@router.post("/api/start-camera")
async def start_camera_stream(
    rtsp_url: str = Query(..., description="URL RTSP de la caméra"),
    username: str = Query(..., description="Nom d'utilisateur pour l'authentification"),
    password: str = Query(..., description="Mot de passe pour l'authentification"),
    camera_name: str = Query(..., description="Nom de la caméra (sera utilisé comme nom de dossier)")
):

    camera_name = camera_name.replace(" ", "_")
    
    try:
        logger.info(f"Démarrage du stream pour caméra: {camera_name}")

        # 1. Démarrer la détection sur la machine GPU
        logger.debug(f"Envoi de la requête à {GPU_API_URL}/start-detection")
        gpu_response = requests.post(
            f"{GPU_API_URL}/start-detection",
            json={
                "rtsp_url": rtsp_url,
                "username": username,
                "password": password,
                "camera_name": camera_name
            },
            timeout=10
        )
        gpu_response.raise_for_status()
        gpu_data = gpu_response.json()
        logger.info(f"Réponse GPU: {gpu_data}")

        # Récupérer l'URL RTSP de sortie depuis la réponse GPU
        rtsp_output = GPU_RTSP_OUTPUT 
        rtsp_camera = gpu_data.get('rtsp_camera')  # URL RTSP originale de la caméra 

        # 2. Attendre que le flux RTSP soit disponible
        logger.debug(f"Vérification du flux RTSP: {GPU_RTSP_OUTPUT }")
        for _ in range(10):  # Attendre jusqu'à 20 secondes
            if check_rtsp_stream(GPU_RTSP_OUTPUT ):
                logger.info("Flux RTSP disponible")
                break
            logger.info("En attente du flux RTSP...")
            time.sleep(2)
        else:
            raise HTTPException(status_code=500, detail="Flux RTSP non disponible après 20 secondes")

        # 3. Créer le répertoire HLS
        camera_dir = os.path.join(HLS_OUTPUT_DIR, camera_name)
        os.makedirs(camera_dir, exist_ok=True)
        
        # Nettoyage du répertoire
        for f in os.listdir(camera_dir):
            file_path = os.path.join(camera_dir, f)
            try:
                if os.path.isfile(file_path):
                    os.unlink(file_path)
            except Exception as e:
                logger.error(f"Erreur suppression fichier {file_path}: {e}")

        # 4. Démarrer FFmpeg pour convertir RTSP en HLS
        playlist_path = os.path.join(camera_dir, "playlist.m3u8")
        ffmpeg_cmd = [
                "ffmpeg",
                "-rtsp_transport", "tcp",
                "-i", GPU_RTSP_OUTPUT,

                # Réduction du délai d’analyse pour un démarrage plus rapide
                "-analyzeduration", "1000000",
                "-probesize", "1000000",

                # Transcodage en H.264 adapté au live
                "-c:v", "libx264",
                "-preset", "veryfast",          # Réduit la latence (plus rapide = moins de qualité, mais meilleure fluidité)
                "-tune", "zerolatency",
                "-profile:v", "baseline",       # Compatibilité maximale avec navigateurs/lecteurs HLS
                "-pix_fmt", "yuv420p",
                "-crf", "23",
                "-g", "30",                     # Keyframe toutes les 1s si 30fps
                "-keyint_min", "30",
                "-sc_threshold", "0",          # Forcer les keyframes réguliers
                "-bf", "0",

                # Paramètres HLS optimisés pour live
                "-f", "hls",
                "-hls_time", "1",                       # Segments courts = moins de latence
                "-hls_list_size", "0",                 # Playlist courte = faible délai
                "-hls_flags", "independent_segments+append_list+temp_file",  # Pour vrai flux live
                "-hls_segment_type", "mpegts",
                "-hls_segment_filename", os.path.join(camera_dir, "seg_%05d.ts"),
                playlist_path
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
        
        logger.debug(f"Commande FFmpeg: {' '.join(ffmpeg_cmd)}")
        
        process_id = str(uuid.uuid4())
        active_processes[process_id] = {
            "process": process,
            "camera_name": camera_name,
            "rtsp_url": rtsp_url
        }

        return JSONResponse({
            "status": "Stream démarré",
            "hls_playlist": f"/hls/{HLS_MAIN_DIR}/{camera_name}/playlist.m3u8",
            "process_id": process_id,
            "gpu_status": gpu_data,
            "camera_name": camera_name,
            "rtsp_camera": rtsp_camera  # Ajout de l'URL RTSP originale
        })

    except requests.RequestException as e:
        logger.error(f"Erreur communication avec API GPU: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur communication avec API GPU: {str(e)}")
    except Exception as e:
        logger.error(f"Erreur démarrage stream: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur démarrage stream: {str(e)}")

@router.get("/api/stop-camera")
async def stop_camera_stream(
    process_id: str = Query(None, description="ID du processus à arrêter (optionnel)"),
    camera_name: str = Query(None, description="Nom de la caméra à arrêter (optionnel)"),
    stop_all: bool = Query(False, description="Arrêter tous les streams (optionnel)")
):
    try:
        # 1. D'abord arrêter le traitement sur la machine GPU
        gpu_response = requests.post(f"{GPU_API_URL}/stop-detection")
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
                        "camera_name": process_info["camera_name"]
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
                        "camera_name": active_processes[process_id]["camera_name"]
                    })
                    del active_processes[process_id]
                except Exception as e:
                    logger.error(f"Erreur arrêt processus {process_id}: {str(e)}")
            else:
                raise HTTPException(status_code=404, detail="Processus non trouvé")
        elif camera_name:
            # Arrêter tous les processus pour une caméra donnée
            for pid, process_info in list(active_processes.items()):
                if process_info["camera_name"] == camera_name:
                    try:
                        process_info["process"].terminate()
                        stopped_processes.append({
                            "process_id": pid,
                            "camera_name": camera_name
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

@router.get("/api/camera-status")
async def get_camera_status(process_id: Optional[str] = Query(None, description="ID du processus")):
    try:
        # Récupérer le statut complet de la machine GPU
        gpu_response = requests.get(f"{GPU_API_URL}/status", timeout=5)
        gpu_response.raise_for_status()
        
        response = {
            "gpu_status": gpu_response.json(),
            "active_processes": {},
            "hls_streams": []
        }
        
        # Ajouter l'état des processus FFmpeg
        if process_id:
            if process_id in active_processes:
                process_info = active_processes[process_id]
                response["active_processes"][process_id] = {
                    "camera_name": process_info["camera_name"],
                    "rtsp_url": process_info["rtsp_url"],
                    "running": process_info["process"].poll() is None,
                    "hls_url": f"/hls/{HLS_MAIN_DIR}/{process_info['camera_name']}/playlist.m3u8"
                }
            else:
                raise HTTPException(status_code=404, detail="Processus non trouvé")
        else:
            for pid, info in active_processes.items():
                response["active_processes"][pid] = {
                    "camera_name": info["camera_name"],
                    "rtsp_url": info["rtsp_url"],
                    "running": info["process"].poll() is None,
                    "hls_url": f"/hls/{HLS_MAIN_DIR}/{info['camera_name']}/playlist.m3u8"
                }
        
        # Ajouter la liste des streams HLS disponibles
        hls_dir = Path(HLS_OUTPUT_DIR)
        for camera_dir in hls_dir.iterdir():
            if camera_dir.is_dir():
                playlist = camera_dir / "playlist.m3u8"
                if playlist.exists():
                    response["hls_streams"].append({
                        "camera_name": camera_dir.name,
                        "playlist_url": f"/hls/{HLS_MAIN_DIR}/{camera_dir.name}/playlist.m3u8",
                        "segments": len(list(camera_dir.glob("*.ts")))
                    })
        
        return JSONResponse(response)
        
    except requests.RequestException as e:
        logger.error(f"Erreur communication avec API GPU: {str(e)}")
        return JSONResponse({
            "error": "Impossible de contacter le serveur GPU",
            "details": str(e)
        }, status_code=503)
    except Exception as e:
        logger.error(f"Erreur récupération statut: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/camera-playlists")
async def list_all_camera_playlists():
    try:
        playlists = []
        hls_dir = Path(HLS_OUTPUT_DIR)
        
        for camera_dir in hls_dir.iterdir():
            if not camera_dir.is_dir():
                continue
                
            # Chercher tous les fichiers .m3u8 dans le dossier
            for playlist_file in camera_dir.glob("*.m3u8"):
                if playlist_file.name != "playlist.m3u8":
                    continue
                try:
                    ts_files = list(camera_dir.glob("*.ts"))
                    playlists.append({
                        "camera_name": camera_dir.name,
                        "segment_count": len(ts_files),
                        "playlist_url": f"/hls/{HLS_MAIN_DIR}/{camera_dir.name}/playlist.m3u8",
                        "last_modified": playlist_file.stat().st_mtime,
                        "directory": camera_dir.name
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


@router.get("/api/active-streams")
async def get_active_streams():
    """
    Retourne la liste des streams RTSP actuellement en cours de traitement.
    """
    try:
        active_streams = []
        
        # Récupérer les informations des processus actifs
        for process_id, process_info in active_processes.items():
            if process_info["process"].poll() is None:  # Vérifie si le processus est toujours en cours
                active_streams.append({
                    "process_id": process_id,
                    "rtsp_url": process_info["rtsp_url"],
                    "username": "",  # Pour des raisons de sécurité, on ne renvoie pas le mot de passe
                    "camera_name": process_info["camera_name"],
                    "status": "running",
                    "hls_playlist": f"/hls/{HLS_MAIN_DIR}/{process_info['camera_name']}/playlist.m3u8"
                })
        
        # Vérifier aussi l'état du GPU si nécessaire
        gpu_response = requests.get(f"{GPU_API_URL}/status")
        gpu_status = gpu_response.json() if gpu_response.status_code == 200 else None
        
        return JSONResponse({
            "active_streams": active_streams,
            "gpu_status": gpu_status,
            "count": len(active_streams)
        })
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des streams actifs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



















############################################### WEBRTC STREAMER ####################################################


# import os
# import uuid
# import logging
# from fastapi import HTTPException, Query, APIRouter, WebSocket, Body
# from fastapi.responses import JSONResponse
# import requests
# from typing import Optional, List, Dict
# import asyncio
# import json
# from pydantic import BaseModel
# import websockets
# from datetime import datetime

# router = APIRouter(tags=["WebRTC Streamer"])

# # Configuration
# GPU_API_URL = "http://192.168.1.153:8050"  # URL de votre API machine GPU
# GPU_WS_URL = "ws://192.168.1.153:8050/ws/webrtc"  # URL WebSocket pour WebRTC

# logger = logging.getLogger(__name__)

# # Dictionnaire pour suivre les connexions WebRTC actives
# active_webrtc_connections: Dict[str, Dict] = {}

# class CameraConfig(BaseModel):
#     rtsp_url: str
#     username: str = "admin"
#     password: str = "password"
#     camera_name: str

# class StreamStatus(BaseModel):
#     camera_name: str
#     rtsp_url: str
#     status: str
#     last_update: datetime
#     gpu_status: Optional[Dict] = None

# @router.websocket("/api/ws/stream/{camera_name}")
# async def proxy_webrtc_stream(websocket: WebSocket, camera_name: str):
#     await websocket.accept()
    
#     connection_id = str(uuid.uuid4())
#     gpu_ws = None
    
#     try:
#         # 1. Récupérer la configuration de la caméra
#         config = get_camera_config(camera_name)
#         if not config:
#             await websocket.close(code=1008, reason="Camera config not found")
#             return
        
#         # 2. Démarrer la détection sur la machine GPU
#         try:
#             gpu_response = requests.post(
#                 f"{GPU_API_URL}/start-detection",
#                 json=config.dict(),
#                 timeout=10
#             )
#             gpu_response.raise_for_status()
#         except requests.RequestException as e:
#             logger.error(f"Failed to start GPU detection: {str(e)}")
#             await websocket.close(code=1011, reason="GPU detection start failed")
#             return
        
#         # 3. Se connecter au WebSocket GPU
#         try:
#             gpu_ws = await websockets.connect(
#                 GPU_WS_URL,
#                 ping_interval=30,
#                 ping_timeout=5,
#                 close_timeout=1
#             )
#             await gpu_ws.send(json.dumps(config.dict()))
#         except Exception as e:
#             logger.error(f"GPU WebSocket connection failed: {str(e)}")
#             await websocket.close(code=1011, reason="GPU connection failed")
#             return
        
#         # Enregistrer la connexion
#         active_webrtc_connections[connection_id] = {
#             "camera_name": config.camera_name,
#             "rtsp_url": config.rtsp_url,
#             "status": "active",
#             "websocket": websocket,
#             "gpu_ws": gpu_ws,
#             "last_update": datetime.now()
#         }
        
#         # 4. Proxy entre client et GPU
#         client_task = asyncio.create_task(forward_client_to_gpu(websocket, gpu_ws))
#         gpu_task = asyncio.create_task(forward_gpu_to_client(websocket, gpu_ws))
        
#         await asyncio.gather(client_task, gpu_task)
        
#     except WebSocketDisconnect:
#         logger.info(f"Client {connection_id} disconnected")
#     except Exception as e:
#         logger.error(f"WebRTC error: {str(e)}", exc_info=True)
#     finally:
#         if connection_id in active_webrtc_connections:
#             del active_webrtc_connections[connection_id]
#         if gpu_ws:
#             await gpu_ws.close()
#         await websocket.close()
#         # Arrêter la détection si plus de clients
#         if not any(conn.get('status') == 'active' for conn in active_webrtc_connections.values()):
#             try:
#                 requests.post(f"{GPU_API_URL}/stop-detection")
#             except:
#                 pass

# async def forward_client_to_gpu(client_ws: WebSocket, gpu_ws):
#     try:
#         while True:
#             data = await client_ws.receive_text()
#             await gpu_ws.send(data)
#     except Exception as e:
#         logger.debug(f"Client->GPU forwarding stopped: {str(e)}")

# async def forward_gpu_to_client(client_ws: WebSocket, gpu_ws):
#     try:
#         while True:
#             data = await gpu_ws.recv()
#             await client_ws.send_text(data)
#     except Exception as e:
#         logger.debug(f"GPU->Client forwarding stopped: {str(e)}")

# @router.post("/api/startcamera", response_model=StreamStatus)
# async def start_stream(config: CameraConfig = Body(...)):
#     """Démarre un nouveau stream"""
#     try:
#         # Vérifier si la caméra est déjà en stream
#         for conn in active_webrtc_connections.values():
#             if conn["camera_name"] == config.camera_name and conn["status"] == "active":
#                 raise HTTPException(
#                     status_code=400,
#                     detail=f"Camera {config.camera_name} is already streaming"
#                 )
        
#         # Préparer la connexion (le WebSocket se chargera du vrai démarrage)
#         connection_id = str(uuid.uuid4())
#         active_webrtc_connections[connection_id] = {
#             "camera_name": config.camera_name,
#             "rtsp_url": config.rtsp_url,
#             "status": "pending",
#             "last_update": datetime.now()
#         }
        
#         # Récupérer le statut GPU
#         gpu_status = get_gpu_status()
        
#         return {
#             "camera_name": config.camera_name,
#             "rtsp_url": config.rtsp_url,
#             "status": "pending",
#             "last_update": datetime.now(),
#             "gpu_status": gpu_status,
#             "websocket_url": f"/ws/stream/{config.camera_name}",
#             "connection_id": connection_id
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Start stream error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/api/camerastatus", response_model=List[StreamStatus])
# async def get_all_streams_status():
#     """Récupère le statut de tous les streams"""
#     try:
#         gpu_status = get_gpu_status()
#         status_list = []
        
#         for conn_id, conn in active_webrtc_connections.items():
#             status_list.append(StreamStatus(
#                 camera_name=conn["camera_name"],
#                 rtsp_url=conn["rtsp_url"],
#                 status=conn["status"],
#                 last_update=conn["last_update"],
#                 gpu_status=gpu_status,
#                 connection_id=conn_id
#             ))
        
#         return status_list
#     except Exception as e:
#         logger.error(f"Status error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/api/stopcamera")
# async def stop_stream(
#     connection_id: Optional[str] = Query(None),
#     camera_name: Optional[str] = Query(None),
#     stop_all: bool = False
# ):
#     """Arrête un ou plusieurs streams"""
#     try:
#         stopped = []
        
#         if stop_all:
#             # Arrêter toutes les connexions
#             for conn_id in list(active_webrtc_connections.keys()):
#                 conn = active_webrtc_connections[conn_id]
#                 if "websocket" in conn:
#                     await conn["websocket"].close()
#                 stopped.append({
#                     "connection_id": conn_id,
#                     "camera_name": conn["camera_name"]
#                 })
#                 del active_webrtc_connections[conn_id]
#         elif connection_id:
#             # Arrêter une connexion spécifique
#             if connection_id in active_webrtc_connections:
#                 conn = active_webrtc_connections[connection_id]
#                 if "websocket" in conn:
#                     await conn["websocket"].close()
#                 stopped.append({
#                     "connection_id": connection_id,
#                     "camera_name": conn["camera_name"]
#                 })
#                 del active_webrtc_connections[connection_id]
#             else:
#                 raise HTTPException(status_code=404, detail="Connection not found")
#         elif camera_name:
#             # Arrêter tous les streams d'une caméra
#             for conn_id, conn in list(active_webrtc_connections.items()):
#                 if conn["camera_name"] == camera_name:
#                     if "websocket" in conn:
#                         await conn["websocket"].close()
#                     stopped.append({
#                         "connection_id": conn_id,
#                         "camera_name": camera_name
#                     })
#                     del active_webrtc_connections[conn_id]
        
#         # Vérifier si on doit arrêter la détection GPU
#         if not any(conn.get('status') == 'active' for conn in active_webrtc_connections.values()):
#             try:
#                 requests.post(f"{GPU_API_URL}/stop-detection")
#             except:
#                 pass
        
#         return {"stopped": stopped, "count": len(stopped)}
    
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"Stop stream error: {str(e)}", exc_info=True)
#         raise HTTPException(status_code=500, detail=str(e))

# def get_camera_config(camera_name: str) -> Optional[CameraConfig]:
#     """Récupère la configuration de la caméra (à adapter)"""
#     # Ici vous devriez implémenter la logique pour récupérer la configuration
#     # depuis une base de données ou un fichier de configuration
#     return CameraConfig(
#         rtsp_url=f"rtsp://{camera_name}/stream",
#         username="admin",
#         password="password",
#         camera_name=camera_name
#     )

# def get_gpu_status() -> Dict:
#     """Récupère le statut de la machine GPU"""
#     try:
#         response = requests.get(f"{GPU_API_URL}/status", timeout=5)
#         response.raise_for_status()
#         return response.json()
#     except requests.RequestException as e:
#         logger.warning(f"GPU status error: {str(e)}")
#         return {"error": "GPU unavailable", "details": str(e)}


# Création du routeur API Web


# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# import requests
# from fastapi.middleware.cors import CORSMiddleware
# import cv2
# import asyncio
# from fastapi import WebSocket
# import websockets

# router = APIRouter(tags=["WebRTC Streamer"])

# # Configuration de la machine GPU
# GPU_API_URL = "http://192.168.1.153:8050"  # Remplacez par l'IP de votre machine GPU

# # Modèles de données
# class CameraConfig(BaseModel):
#     rtsp_url: str
#     username: str
#     password: str

# @router.post("/api/start-detection")
# async def start_detection(config: CameraConfig):
#     """
#     Transmet la configuration de la caméra à la machine GPU
#     et démarre le traitement.
#     """
#     try:
#         # Envoi de la configuration à la machine GPU
#         response = requests.post(
#             f"{GPU_API_URL}/start-detection",
#             json=config.dict()
#         )
#         response.raise_for_status()
        
#         result = response.json()
        
#         if result.get("status") == "already running":
#             # Si le traitement est déjà en cours, on récupère juste le flux RTSP
#             status_response = requests.get(f"{GPU_API_URL}/status")
#             status = status_response.json()
#             return {
#                 "status": "success",
#                 "message": "Detection already running on GPU",
#                 "rtsp_stream": status["rtsp_output"]
#             }
        
#         return {
#             "status": "success",
#             "message": "Detection started on GPU",
#             "rtsp_stream": result["rtsp"]
#         }
#     except requests.exceptions.RequestException as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to communicate with GPU machine: {str(e)}"
#         )

# @router.post("/api/stop-detection")
# async def stop_detection():
#     """
#     Demande à la machine GPU d'arrêter le traitement.
#     """
#     try:
#         response = requests.post(f"{GPU_API_URL}/stop-detection")
#         response.raise_for_status()
#         return response.json()
#     except requests.exceptions.RequestException as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to communicate with GPU machine: {str(e)}"
#         )

# @router.get("/api/status")
# async def get_status():
#     """
#     Récupère le statut du traitement depuis la machine GPU.
#     """
#     try:
#         response = requests.get(f"{GPU_API_URL}/status")
#         response.raise_for_status()
#         return response.json()
#     except requests.exceptions.RequestException as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to communicate with GPU machine: {str(e)}"
#         )

# @router.get("/api/stream-url")
# async def get_stream_url():
#     """
#     Retourne l'URL du flux RTSP traité par la machine GPU.
#     """
#     try:
#         response = requests.get(f"{GPU_API_URL}/status")
#         response.raise_for_status()
#         status = response.json()
#         return {
#             "rtsp_stream": status["rtsp_output"],
#             "detection_active": status["detection_active"]
#         }
#     except requests.exceptions.RequestException as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to communicate with GPU machine: {str(e)}"
#         )
    

# @router.websocket("/api/rtsp-ws-proxy")
# async def rtsp_proxy(websocket: WebSocket):
#     await websocket.accept()
#     gpu_ws = None
    
#     try:
#         # 1. Recevoir la config RTSP du client
#         config = await websocket.receive_json()
        
#         # 2. Connecter au WebSocket de la machine GPU
#         async with websockets.connect(f"ws://192.168.1.153:8050/ws/webrtc") as gpu_ws:
#             # 3. Transmettre les messages dans les deux sens
#             while True:
#                 try:
#                     # Message du client vers GPU
#                     client_msg = await websocket.receive_text()
#                     await gpu_ws.send(client_msg)
                    
#                     # Message du GPU vers client
#                     gpu_msg = await gpu_ws.recv()
#                     await websocket.send_text(gpu_msg)
#                 except:
#                     break
#     except Exception as e:
#         print(f"Proxy error: {e}")
#     finally:
#         if gpu_ws:
#             await gpu_ws.close()
#         await websocket.close()














# from fastapi import FastAPI, APIRouter
# import asyncio
# import websockets
# import json

# router = APIRouter(tags=["TEST WEBRTC"])


# # Endpoint pour tester la connexion WebSocket
# @router.get("/api/test-webrtc")
# async def test_webrtc():
#     ws_url = "ws://192.168.1.153:8050/ws/webrtc"
    
#     camera_config = {
#         "rtsp_url": "192.168.1.155:554/stream",
#         "username": "admin",
#         "password": "admin"
#     }

#     fake_offer = {
#         "type": "offer",
#         "sdp": "v=0\r\n..."  # ici tu dois mettre une vraie SDP si tu veux un vrai test WebRTC
#     }

#     try:
#         async with websockets.connect(ws_url) as websocket:
#             # 1. Envoyer la config de la caméra
#             await websocket.send(json.dumps(camera_config))

#             # 2. Envoyer une fausse SDP (WebRTC offer)
#             await websocket.send(json.dumps(fake_offer))

#             # 3. Attendre la réponse du serveur
#             response = await websocket.recv()
#             return {"status": "success", "message": json.loads(response)}
    
#     except Exception as e:
#         return {"status": "error", "message": str(e)}



