from fastapi import APIRouter, HTTPException
from starlette.responses import StreamingResponse
import httpx
import logging
from typing import AsyncGenerator
from fastapi.responses import HTMLResponse


router = APIRouter(tags=["Video Entrée"])
GPU_API_BASE = "http://192.168.1.153:8000/tracking_sortie"
STREAM_TIMEOUT = 30.0  # Timeout plus long pour les flux
CHUNK_SIZE = 1024 * 16  # Taille des chunks pour le streaming


async def proxy_stream(gpu_endpoint: str) -> AsyncGenerator[bytes, None]:
    url = f"{GPU_API_BASE}/{gpu_endpoint}"
    try:
        async with httpx.AsyncClient(timeout=STREAM_TIMEOUT) as client:
            async with client.stream(
                "GET",
                url,
                headers={
                    "Accept": "multipart/x-mixed-replace",
                    "Connection": "keep-alive"
                }
            ) as response:
                response.raise_for_status()
                
                # Vérification du content-type
                content_type = response.headers.get("content-type", "").lower()
                if "multipart/x-mixed-replace" not in content_type:
                    logging.error(f"Content-Type invalide: {content_type}")
                    raise HTTPException(
                        status_code=502,
                        detail="Le serveur GPU ne renvoie pas un flux MJPEG valide"
                    )
                
                # Stream direct sans buffer
                async for chunk in response.aiter_bytes(chunk_size=CHUNK_SIZE):
                    yield chunk
                    
    except httpx.TimeoutException:
        logging.error("Timeout lors de la connexion au serveur GPU")
        raise HTTPException(
            status_code=504,
            detail="Timeout de connexion au serveur GPU"
        )
    except httpx.RequestError as e:
        logging.error(f"Erreur de connexion: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Impossible de se connecter au serveur GPU"
        )
    except Exception as e:
        logging.error(f"Erreur inattendue: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erreur interne du serveur"
        )

@router.get("/api/video_sortie")
async def video_sortie():
    return StreamingResponse(
        proxy_stream("tracking_sortie"),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Transfer-Encoding": "chunked"
        }
    )


