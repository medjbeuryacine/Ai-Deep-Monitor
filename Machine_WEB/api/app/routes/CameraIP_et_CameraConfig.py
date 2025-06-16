import httpx
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
import logging

router = APIRouter(tags=["CameraIP et CameraConfig"])

# Configuration
CAMERA_IP_API_URL = "http://192.168.1.154:8000"  # URL de l'API Camera IP
CAMERA_CONFIG_API_URL = "http://192.168.1.154:8000"  # URL de l'API Camera Config
WEB_SERVER_URL = "http://192.168.1.154:8000"  # URL du serveur web

logger = logging.getLogger(__name__)

async def fetch_active_streams() -> List[Dict]:
    """Récupère les streams actifs depuis l'API Camera IP"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CAMERA_IP_API_URL}/api/active-streams")
            response.raise_for_status()
            data = response.json()
            return data.get("active_streams", [])
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des streams actifs: {str(e)}")
        raise HTTPException(status_code=500, detail="Impossible de récupérer les streams actifs")

async def fetch_configured_cameras() -> List[Dict]:
    """Récupère toutes les caméras configurées depuis l'API Camera Config"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CAMERA_CONFIG_API_URL}/api/cameras/")
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des caméras configurées: {str(e)}")
        raise HTTPException(status_code=500, detail="Impossible de récupérer les caméras configurées")

@router.get("/api/rtsp_playlists", response_model=List[Dict])
async def get_matching_camera_playlists():
    """
    Récupère les playlists HLS pour les caméras qui sont:
    1. Actives dans l'API Camera IP (stream en cours)
    2. Configurées avec flux activé dans l'API Camera Config
    """
    try:
        # Récupérer les données des deux APIs
        active_streams = await fetch_active_streams()
        configured_cameras = await fetch_configured_cameras()

        matching_playlists = []

        # Pour chaque stream actif
        for stream in active_streams:
            rtsp_url = stream.get("rtsp_url", "").strip()
            camera_name = stream.get("camera_name", "").strip()
            
            # Trouver la caméra correspondante dans la configuration
            for camera in configured_cameras:
                # Normaliser les noms pour la comparaison
                config_name = camera.get("nom_cam", "").strip().replace(" ", "_")
                
                # Vérifier si le nom correspond
                name_match = config_name.lower() == camera_name.lower()
                
                # Vérifier les correspondances de flux RTSP
                rtsp_matches = []
                
                # Vérifier chaque flux possible
                for flux_type in ["principal", "secondaire", "tertiaire"]:
                    flux_url = camera.get(f"adresse_flux_{flux_type}", "").strip()
                    flux_active = camera.get(f"flux_{flux_type}_active", False)
                    
                    if flux_url and flux_active:
                        # Comparaison plus robuste des URL RTSP
                        if (rtsp_url.lower() == flux_url.lower() or 
                            rtsp_url.replace("rtsp://", "").lower() == flux_url.replace("rtsp://", "").lower()):
                            rtsp_matches.append(flux_type)
                
                # Si on a une correspondance de nom ou de flux RTSP
                if name_match or rtsp_matches:
                    # Construire l'URL de la playlist
                    playlist_url = f"/hls/Camera_IP/{camera_name}/playlist.m3u8"
                    
                    # Déterminer quel type de correspondance
                    match_type = []
                    if name_match:
                        match_type.append("name")
                    if rtsp_matches:
                        match_type.extend([f"rtsp_{ft}" for ft in rtsp_matches])
                    
                    matching_playlists.append({
                        "camera_id": camera.get("id_cam"),
                        "camera_name": camera_name,
                        "config_camera_name": config_name,
                        "rtsp_url": rtsp_url,
                        "playlist_url": playlist_url,
                        "is_active": camera.get("is_active", False),
                        "emplacement": camera.get("emplacement", ""),
                        "match_type": ", ".join(match_type),
                        "matched_flux_types": rtsp_matches
                    })
                    break  # Passer au stream suivant après avoir trouvé une correspondance

        return matching_playlists

    except HTTPException:
        raise  # On propage les HTTPException déjà définies
    except Exception as e:
        logger.error(f"Erreur inattendue: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

@router.get("/api/rtsp_all", response_model=Dict)
async def get_all_camera_streams_info():
    """
    Retourne toutes les informations combinées:
    - Streams actifs
    - Caméras configurées
    - Playlists correspondantes
    """
    try:
        active_streams = await fetch_active_streams()
        configured_cameras = await fetch_configured_cameras()
        playlists = await get_matching_camera_playlists()

        return {
            "active_streams": active_streams,
            "configured_cameras": configured_cameras,
            "matching_playlists": playlists,
            "counts": {
                "active_streams": len(active_streams),
                "configured_cameras": len(configured_cameras),
                "matching_playlists": len(playlists)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des informations combinées: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")