from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from typing import Dict, Any
import requests
import json
import os
import logging
import time
import asyncio
import uuid
import shutil
import httpx

# Constantes pour les chemins de fichiers
VIDEOS_DIR = "videos"
HLS_OUTPUT_DIR = "streams/hls_output"
HLS_CONVERSIONS_FILE = "streams/hls_conversions.json"

# Configuration de l'API GPU
GPU_API_BASE_URL = "http://192.168.1.153:8020"  # Adresse de la machine GPU

# Création du routeur FastAPI pour l'upload
router = APIRouter(tags=["Video Upload Processing"])

# Configuration du logging
logger = logging.getLogger("video-upload-api")

# Créer les répertoires nécessaires
os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(HLS_OUTPUT_DIR, exist_ok=True)
os.makedirs(os.path.dirname(HLS_CONVERSIONS_FILE), exist_ok=True)

# Fonctions pour gérer les conversions HLS
def read_hls_conversions():
    if not os.path.exists(HLS_CONVERSIONS_FILE):
        with open(HLS_CONVERSIONS_FILE, 'w') as f:
            json.dump({}, f)
        return {}
    
    try:
        with open(HLS_CONVERSIONS_FILE, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        return {}

def write_hls_conversion(stream_id, conversion_data):
    conversions = read_hls_conversions()
    conversions[stream_id] = conversion_data
    
    with open(HLS_CONVERSIONS_FILE, 'w') as f:
        json.dump(conversions, f, indent=2)

def update_hls_conversion_status(stream_id, status):
    conversions = read_hls_conversions()
    if stream_id in conversions:
        conversions[stream_id]["status"] = status
        conversions[stream_id]["updated_at"] = time.time()
        
        with open(HLS_CONVERSIONS_FILE, 'w') as f:
            json.dump(conversions, f, indent=2)
        return True
    return False

# Fonction pour surveiller le processus de conversion
async def monitor_hls_conversion(stream_id, process):
    """Surveille le processus FFmpeg et met à jour le statut de conversion."""
    try:
        # Attendre la fin du processus
        return_code = await process.wait()

        if return_code == 0:
            update_hls_conversion_status(stream_id, "completed")
            logger.info(f"Conversion HLS terminée avec succès pour {stream_id}")
        else:
            update_hls_conversion_status(stream_id, "failed")
            logger.error(f"Erreur lors de la conversion HLS pour {stream_id}, code: {return_code}")
    except Exception as e:
        logger.error(f"Erreur lors de la surveillance du processus de conversion: {str(e)}")
        update_hls_conversion_status(stream_id, "error")

# ROUTES API pour l'upload de vidéos

@router.post("/api/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    detect: str = Form("all"),
    quality: str = Form("hd"),
    background_tasks: BackgroundTasks = None
):
    try:
        # 1. Configuration du client HTTP
        timeout = httpx.Timeout(30.0, connect=5.0)
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            # 2. Préparation des données
            files = {
                'file': (file.filename, await file.read(), 'video/mp4')
            }
            data = {
                'detect': detect,
                'q': quality
            }
            
            # 3. Envoi à la GPU
            response = await client.post(
                f"{GPU_API_BASE_URL}/api/upload",
                files=files,
                data=data
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"GPU API Error: {response.text()}"
                )
            
            gpu_data = response.json()
            
            # 4. Surveillance en arrière-plan
            background_tasks.add_task(
                verify_processing_status,
                gpu_data["task_id"]
            )
            
            return {
                "status": "processing",
                "gpu_task_id": gpu_data["task_id"],
                "monitor_url": f"/api/status/{gpu_data['task_id']}"
            }

    except httpx.ConnectError:
        raise HTTPException(503, "Impossible de se connecter à la GPU")
    except Exception as e:
        raise HTTPException(500, f"Erreur interne: {str(e)}")

async def verify_processing_status(task_id: str):
    """Vérifie périodiquement l'état du traitement"""
    async with httpx.AsyncClient() as client:
        while True:
            try:
                response = await client.get(
                    f"{GPU_API_BASE_URL}/api/status/{task_id}",
                    timeout=5
                )
                if response.json().get("status") == "completed":
                    break
            except:
                pass
            await asyncio.sleep(5)

@router.get("/api/videos/{filename}")
async def get_video(filename: str):
    file_path = os.path.join(VIDEOS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Vidéo non trouvée")
   
    return FileResponse(file_path)

@router.get("/api/upload-status/{gpu_task_id}")
async def check_upload_status(gpu_task_id: str):
    try:
        response = requests.get(f"{GPU_API_BASE_URL}/api/upload/status/{gpu_task_id}")
        response.raise_for_status()
        
        status_data = response.json()
        
        # Adapter la réponse si nécessaire
        return {
            "status": status_data.get("status"),
            "stream_url": status_data.get("stream_url"),
            "download_url": status_data.get("download_url"),
            "progress": status_data.get("progress"),
            "is_ready": status_data.get("status") == "Terminé"
        }
    
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Erreur de communication avec la GPU: {str(e)}")

@router.get("/api/videos")
async def list_videos():
    videos = []
    for file in os.listdir(VIDEOS_DIR):
        if os.path.isfile(os.path.join(VIDEOS_DIR, file)):
            videos.append({
                "filename": file,
                "url": f"/api/videos/{file}",
                "process_url": f"/api/process-uploaded-video?url=/api/videos/{file}"
            })
    return videos

@router.delete("/api/videos/{filename}")
async def delete_video(filename: str):
    """Supprime une vidéo uploadée."""
    file_path = os.path.join(VIDEOS_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Vidéo non trouvée")
    
    try:
        os.remove(file_path)
        return {"message": "Vidéo supprimée avec succès", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la suppression: {str(e)}")

@router.get("/api/process-uploaded-video")
async def process_uploaded_video(
    url: str = Query(..., description="URL de la vidéo uploadée"),
    detect: str = Query("all", description="Type de détection (person,face,phone,all)"),
    quality: str = Query("hd", description="Qualité (hd ou low)")
):
    # Vérifier que l'URL pointe vers une vidéo uploadée
    if not url.startswith("/api/videos/"):
        raise HTTPException(status_code=400, detail="L'URL doit pointer vers une vidéo uploadée")
    
    try:
        # URL complète pour la requête
        video_url = f"http://localhost{url}" if url.startswith("/") else url
        
        # Créer un ID unique pour ce stream
        stream_id = str(uuid.uuid4())
        
        # Préparer les paramètres pour l'API GPU (adaptés à la première API)
        gpu_params = {
            "url": video_url,
            "detect": detect,
            "q": quality,
            "loop": False
        }
        
        # Appel à l'API GPU
        gpu_response = requests.get(f"{GPU_API_BASE_URL}/api/process", params=gpu_params)
        gpu_response.raise_for_status()  # Lever une exception si l'appel échoue
        
        # Traiter la réponse
        gpu_data = gpu_response.json()
        
        # Enregistrer les informations de conversion
        conversion_data = {
            "stream_id": stream_id,
            "original_url": url,
            "gpu_task_id": gpu_data.get("task_id"),
            "status": "processing",
            "created_at": time.time(),
            "updated_at": time.time(),
            "detect_type": detect,
            "quality": quality
        }
        
        write_hls_conversion(stream_id, conversion_data)
        
        # Retourner les informations de statut
        return {
            "status": "processing",
            "stream_id": stream_id,
            "gpu_task_id": gpu_data.get("task_id"),
            "monitor_url": f"/api/stream-status/{stream_id}"
        }
    
    except requests.RequestException as e:
        logger.error(f"Erreur lors de la communication avec l'API GPU: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Erreur de communication avec la GPU: {str(e)}")
    except Exception as e:
        logger.error(f"Erreur interne lors du traitement: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

# Ajoutons la route pour vérifier le statut d'un stream
@router.get("/api/stream-status/{stream_id}")
async def check_stream_status(stream_id: str):
    """Vérifie le statut d'un stream vidéo en cours de traitement."""
    # Récupérer les informations de conversion
    conversions = read_hls_conversions()
    
    if stream_id not in conversions:
        raise HTTPException(status_code=404, detail="Stream non trouvé")
    
    conversion_data = conversions[stream_id]
    
    # Si le stream est en cours de traitement, vérifier le statut auprès de l'API GPU
    if conversion_data["status"] == "processing":
        try:
            gpu_task_id = conversion_data.get("gpu_task_id")
            if not gpu_task_id:
                raise HTTPException(status_code=500, detail="ID de tâche GPU manquant")
            
            gpu_response = requests.get(f"{GPU_API_BASE_URL}/api/status/{gpu_task_id}")
            gpu_response.raise_for_status()
            
            gpu_status = gpu_response.json()
            
            # Mettre à jour le statut si nécessaire
            if gpu_status.get("status") == "completed":
                update_hls_conversion_status(stream_id, "completed")
                conversion_data["status"] = "completed"
                conversion_data["stream_url"] = gpu_status.get("stream_url")
                conversion_data["download_url"] = gpu_status.get("download_url")
            elif gpu_status.get("status") == "failed":
                update_hls_conversion_status(stream_id, "failed")
                conversion_data["status"] = "failed"
        
        except requests.RequestException as e:
            logger.warning(f"Impossible de vérifier le statut GPU pour {stream_id}: {str(e)}")
    
    # Retourner les informations de statut
    return {
        "stream_id": stream_id,
        "status": conversion_data["status"],
        "created_at": conversion_data["created_at"],
        "updated_at": conversion_data.get("updated_at", conversion_data["created_at"]),
        "stream_url": conversion_data.get("stream_url"),
        "download_url": conversion_data.get("download_url"),
        "detect_type": conversion_data.get("detect_type"),
        "quality": conversion_data.get("quality"),
        "is_ready": conversion_data["status"] == "completed"
    }

# Route pour télécharger le résultat d'un stream
@router.get("/api/download-stream/{stream_id}")
async def download_stream_result(stream_id: str):
    """Télécharge le résultat d'un stream vidéo traité."""
    # Récupérer les informations de conversion
    conversions = read_hls_conversions()
    
    if stream_id not in conversions:
        raise HTTPException(status_code=404, detail="Stream non trouvé")
    
    conversion_data = conversions[stream_id]
    
    if conversion_data["status"] != "completed":
        raise HTTPException(status_code=400, detail="Le stream n'est pas encore terminé")
    
    if "download_url" not in conversion_data:
        raise HTTPException(status_code=404, detail="URL de téléchargement non disponible")
    
    try:
        # Rediriger vers l'URL de téléchargement fournie par l'API GPU
        return {
            "redirect_url": conversion_data["download_url"]
        }
    except Exception as e:
        logger.error(f"Erreur lors de la préparation du téléchargement: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

# Route pour lister tous les streams
@router.get("/api/streams")
async def list_streams(status: str = Query(None, description="Filtrer par statut (processing, completed, failed)")):
    """Liste tous les streams vidéo enregistrés."""
    try:
        conversions = read_hls_conversions()
        streams = []
        
        for stream_id, data in conversions.items():
            # Filtrer par statut si demandé
            if status and data.get("status") != status:
                continue
                
            streams.append({
                "stream_id": stream_id,
                "status": data.get("status", "unknown"),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at", data.get("created_at")),
                "original_url": data.get("original_url"),
                "detect_type": data.get("detect_type"),
                "quality": data.get("quality"),
                "stream_url": data.get("stream_url"),
                "is_ready": data.get("status") == "completed"
            })
        
        # Trier par date de création (plus récent en premier)
        streams.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        
        return streams
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des streams: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")

# Route pour supprimer un stream
@router.delete("/api/streams/{stream_id}")
async def delete_stream(stream_id: str):
    """Supprime un stream vidéo."""
    conversions = read_hls_conversions()
    
    if stream_id not in conversions:
        raise HTTPException(status_code=404, detail="Stream non trouvé")
    
    try:
        # Supprimer les données de conversion
        del conversions[stream_id]
        
        with open(HLS_CONVERSIONS_FILE, 'w') as f:
            json.dump(conversions, f, indent=2)
        
        # Supprimer les fichiers associés (si présents)
        stream_dir = os.path.join(HLS_OUTPUT_DIR, stream_id)
        if os.path.exists(stream_dir):
            shutil.rmtree(stream_dir)
        
        return {"message": "Stream supprimé avec succès", "stream_id": stream_id}
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du stream {stream_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur interne: {str(e)}")