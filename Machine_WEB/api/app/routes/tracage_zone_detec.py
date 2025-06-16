# from fastapi import APIRouter, HTTPException, Query
# from fastapi.responses import JSONResponse
# import httpx
# import base64
# import cv2
# import numpy as np
# import logging

# router = APIRouter(
#     prefix="/api",
#     tags=["Zone Tracée"]
# )

# @router.get("/api/capture-frame")
# async def proxy_capture_frame(url: str = Query(..., description="URL du flux MJPEG distant")):
#     """
#     Proxy distant qui capture une frame depuis un flux MJPEG (ex: /video_entree) et renvoie l'image en base64
#     """
#     try:
#         async with httpx.AsyncClient(timeout=5.0) as client:
#             async with client.stream("GET", url) as response:
#                 if response.status_code != 200:
#                     raise HTTPException(status_code=response.status_code, detail="Erreur sur le flux MJPEG distant")

#                 buffer = b""
#                 async for chunk in response.aiter_bytes():
#                     buffer += chunk
#                     start = buffer.find(b'\xff\xd8')
#                     end = buffer.find(b'\xff\xd9')
#                     if start != -1 and end != -1 and end > start:
#                         jpg_data = buffer[start:end + 2]
#                         np_array = np.frombuffer(jpg_data, np.uint8)
#                         img = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

#                         if img is None:
#                             raise HTTPException(status_code=500, detail="Impossible de décoder l'image")

#                         _, jpeg = cv2.imencode(".jpg", img)
#                         frame_b64 = base64.b64encode(jpeg).decode("utf-8")
#                         return JSONResponse(content={"frame_data": frame_b64})

#         raise HTTPException(status_code=500, detail="Aucune frame trouvée dans le flux distant")

#     except httpx.RequestError as e:
#         logging.error(f"[Erreur connexion flux MJPEG distant] {e}")
#         raise HTTPException(status_code=503, detail="Connexion au flux distant impossible")

#     except Exception as e:
#         logging.error(f"[Erreur proxy capture frame] {e}")
#         raise HTTPException(status_code=500, detail="Erreur interne lors de la capture proxy")



from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import httpx
import logging

router = APIRouter()
GPU_API_BASE = "http://192.168.1.153:8000"

@router.get("/api/capture-frame")
async def proxy_capture_frame():
    try:
        # Appel à l'API GPU pour générer la frame
        target_url = f"{GPU_API_BASE}/api/capture-frame"
        logging.info(f"Appel à l'API GPU pour générer la frame: {target_url}")
       
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(target_url)
        
        if response.status_code != 200:
            logging.error(f"Erreur API GPU: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        # Récupérer la réponse JSON
        response_data = response.json()
        
        if "frame" not in response_data or not response_data.get("success", False):
            logging.error(f"Format de réponse invalide: {response_data}")
            raise HTTPException(status_code=500, detail="Format de réponse invalide de l'API GPU")
        
        # La frame est déjà encodée en base64 dans la réponse
        frame_data = response_data["frame"]
        logging.info("Image récupérée avec succès depuis l'API GPU.")
        
        # Retourner l'image encodée dans un JSON
        return JSONResponse(content={"success": True, "frame": frame_data})
    except Exception as e:
        logging.error(f"Exception complète: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


# from fastapi import APIRouter, HTTPException
# from starlette.responses import StreamingResponse
# import logging
# import httpx
# from typing import AsyncGenerator

# router = APIRouter(tags=["Dessiner Zone"])
# GPU_API_URL = "http://192.168.1.153:8000/dessiner-zone"

# # Client HTTP partagé pour toutes les requêtes
# client = httpx.AsyncClient(timeout=30.0)

# async def video_stream() -> AsyncGenerator[bytes, None]:
#     try:
#         async with client.stream(
#             "GET", 
#             GPU_API_URL,
#             headers={"Connection": "keep-alive"}
#         ) as response:
#             if response.status_code != 200:
#                 raise HTTPException(status_code=response.status_code, detail="Erreur API GPU")
            
#             content_type = response.headers.get("Content-Type")
#             if not content_type or "multipart/x-mixed-replace" not in content_type:
#                 raise HTTPException(status_code=500, detail="Format vidéo non supporté")
            
#             async for chunk in response.aiter_bytes():
#                 yield chunk
                
#     except httpx.RequestError as e:
#         logging.error(f"Erreur de connexion: {str(e)}")
#         raise HTTPException(status_code=503, detail="Service indisponible")
#     except Exception as e:
#         logging.error(f"Erreur inattendue: {str(e)}")
#         raise HTTPException(status_code=500, detail="Erreur interne")

# @router.get("/api/dessiner-zone")
# async def get_video_entree():
#     """Récupère le flux vidéo d'entrée depuis l'API GPU"""
#     return StreamingResponse(
#         video_stream(),
#         media_type="multipart/x-mixed-replace; boundary=frame",
#         headers={"Cache-Control": "no-cache"}
#     )