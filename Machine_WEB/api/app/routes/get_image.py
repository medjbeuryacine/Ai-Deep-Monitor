# import os
# import cv2
# import time
# from datetime import datetime
# from fastapi import APIRouter, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# import logging
# import requests
# from io import BytesIO
# import numpy as np
 
# print(cv2.__version__)
 
# router = APIRouter(tags=["Camera Capture"])
 
# # Configuration
# IMAGE_DIR = "/usr/src/app/static/images"
# os.makedirs(IMAGE_DIR, exist_ok=True)
# HTTP_URL = os.getenv("HTTP_URL", "http://88.185.182.1/webcamlogi")
# last_image = None
 
# # Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)
 
# def test_http_connection():
#     """Teste la connexion HTTP avec timeout"""
#     try:
#         response = requests.get(HTTP_URL, stream=True, timeout=10)
#         return response.status_code == 200
#     except requests.exceptions.RequestException as e:
#         logger.error(f"HTTP Connection Error: {e}")
#         return False
 
# @router.get("/capture")
# async def capture_image():
#     global last_image
   
#     try:
#         # Méthode 1: Essayer d'abord avec OpenCV (pour les flux MJPEG standard)
#         cap = cv2.VideoCapture(HTTP_URL)
#         cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
#         cap.set(cv2.CAP_PROP_FPS, 10)
       
#         start_time = time.time()
#         while not cap.isOpened() and (time.time() - start_time) < 5:
#             time.sleep(0.1)
           
#         if cap.isOpened():
#             ret, frame = cap.read()
#             if ret:
#                 filename = f"capture_{int(time.time())}.jpg"
#                 filepath = os.path.join(IMAGE_DIR, filename)
#                 cv2.imwrite(filepath, frame)
#                 last_image = filename
#                 cap.release()
#                 return {"status": "success", "file": filename}
#             cap.release()
 
#         # Méthode 2: Fallback avec requêtes HTTP manuelles
#         response = requests.get(HTTP_URL, stream=True, timeout=10)
#         if response.status_code == 200:
#             bytes_buffer = bytes()
           
#             for chunk in response.iter_content(chunk_size=1024):
#                 bytes_buffer += chunk
#                 a = bytes_buffer.find(b'\xff\xd8')  # Début JPEG
#                 b = bytes_buffer.find(b'\xff\xd9')  # Fin JPEG
               
#                 if a != -1 and b != -1:
#                     jpg_data = bytes_buffer[a:b+2]
#                     img = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)
                   
#                     if img is not None:
#                         filename = f"capture_{int(time.time())}.jpg"
#                         filepath = os.path.join(IMAGE_DIR, filename)
#                         cv2.imwrite(filepath, img)
#                         last_image = filename
#                         return {"status": "success", "file": filename}
       
#         raise RuntimeError("Impossible de capturer une image valide")
 
#     except Exception as e:
#         logger.error(f"Capture Error: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur: {str(e)}. Solutions alternatives:\n"
#                   "1. Vérifiez que le flux HTTP est accessible\n"
#                   "2. Essayez une URL différente (/?action=stream ou /video)\n"
#                   "3. Vérifiez les logs du serveur HTTP"
#         )
 
# @router.get("/api/latest-image")
# async def get_latest_image():
#     """Get the latest captured image"""
#     if not last_image:
#         raise HTTPException(
#             status_code=404,
#             detail="No image captured yet"
#         )
   
#     image_path = os.path.join(IMAGE_DIR, last_image)
#     if not os.path.exists(image_path):
#         raise HTTPException(
#             status_code=410,
#             detail="Image file not found"
#         )
   
#     return FileResponse(image_path)
 
# @router.get("/test-connection")
# async def test_connection():
#     """Endpoint pour tester la connexion à la caméra"""
#     if test_http_connection():
#         return {"status": "success", "message": "HTTP connection working"}
#     else:
#         raise HTTPException(
#             status_code=503,
#             detail="Could not establish connection to HTTP stream"
#         )









import os
import cv2
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
import logging
import requests
from io import BytesIO
import numpy as np

router = APIRouter(tags=["Camera Capture"])

# Configuration
IMAGE_DIR = "static/images"
os.makedirs(IMAGE_DIR, exist_ok=True)
HTTP_URL = os.getenv("HTTP_URL", "http://88.185.182.1/webcamlogi")
last_image = None

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_http_connection():
    try:
        response = requests.get(HTTP_URL, stream=True, timeout=10)
        return response.status_code == 200
    except requests.exceptions.RequestException as e:
        logger.error(f"HTTP Connection Error: {e}")
        return False

@router.get("/api/capture")
async def capture_image():
    global last_image
    
    try:
        # Essayer avec OpenCV d'abord
        cap = cv2.VideoCapture(HTTP_URL)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"capture_{timestamp}.jpg"
                filepath = os.path.join(IMAGE_DIR, filename)
                cv2.imwrite(filepath, frame)
                last_image = filename
                cap.release()
                return {"status": "success", "filename": filename}
            cap.release()

        # Fallback: Méthode HTTP manuelle
        response = requests.get(HTTP_URL, stream=True, timeout=10)
        if response.status_code == 200:
            bytes_buffer = bytes()
            
            for chunk in response.iter_content(chunk_size=1024):
                bytes_buffer += chunk
                a = bytes_buffer.find(b'\xff\xd8')  # Début JPEG
                b = bytes_buffer.find(b'\xff\xd9')  # Fin JPEG
                
                if a != -1 and b != -1:
                    jpg_data = bytes_buffer[a:b+2]
                    img = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)
                    
                    if img is not None:
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        filename = f"capture_{timestamp}.jpg"
                        filepath = os.path.join(IMAGE_DIR, filename)
                        cv2.imwrite(filepath, img)
                        last_image = filename
                        return {"status": "success", "filename": filename}
        
        raise HTTPException(status_code=500, detail="Impossible de capturer une image valide")

    except Exception as e:
        logger.error(f"Capture Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de capture: {str(e)}"
        )

@router.get("/api/latest-image")
async def get_latest_image():
    """Get the latest captured image"""
    if not last_image:
        raise HTTPException(status_code=404, detail="Aucune image capturée")
    
    image_path = os.path.join(IMAGE_DIR, last_image)
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image non trouvée")
    
    return FileResponse(image_path)

@router.get("/api/last-image-file")
async def get_last_image_file():
    """Get the last image file name"""
    if not os.listdir(IMAGE_DIR):
        raise HTTPException(status_code=404, detail="Aucune image disponible")
    
    last_image_name = sorted(os.listdir(IMAGE_DIR))[-1]
    return {"filename": last_image_name}

@router.get("/api/test-connection")
async def test_connection():
    if test_http_connection():
        return {"status": "success", "message": "Connexion HTTP fonctionnelle"}
    else:
        raise HTTPException(
            status_code=503,
            detail="Impossible de se connecter au flux HTTP"
        )



# import os
# import cv2
# import time
# from datetime import datetime
# from fastapi import APIRouter, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.middleware.cors import CORSMiddleware
# import logging
# import requests
# from io import BytesIO
# import numpy as np
 
# print(cv2.__version__)
 
# router = APIRouter(tags=["Camera Capture"])
 
# # Configuration
# IMAGE_DIR = "/usr/src/app/static/images"
# os.makedirs(IMAGE_DIR, exist_ok=True)
# HTTP_URL = os.getenv("HTTP_URL", "http://88.185.182.1/webcamlogi")
# last_image = None
 
# # Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)
 
# def test_http_connection():
#     """Teste la connexion HTTP avec timeout"""
#     try:
#         response = requests.get(HTTP_URL, stream=True, timeout=10)
#         return response.status_code == 200
#     except requests.exceptions.RequestException as e:
#         logger.error(f"HTTP Connection Error: {e}")
#         return False
 
# @router.get("/capture")
# async def capture_image():
#     global last_image
   
#     try:
#         # Méthode 1: Essayer d'abord avec OpenCV (pour les flux MJPEG standard)
#         cap = cv2.VideoCapture(HTTP_URL)
#         cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
#         cap.set(cv2.CAP_PROP_FPS, 10)
       
#         start_time = time.time()
#         while not cap.isOpened() and (time.time() - start_time) < 5:
#             time.sleep(0.1)
           
#         if cap.isOpened():
#             ret, frame = cap.read()
#             if ret:
#                 filename = f"capture_{int(time.time())}.jpg"
#                 filepath = os.path.join(IMAGE_DIR, filename)
#                 cv2.imwrite(filepath, frame)
#                 last_image = filename
#                 cap.release()
#                 return {"status": "success", "file": filename}
#             cap.release()
 
#         # Méthode 2: Fallback avec requêtes HTTP manuelles
#         response = requests.get(HTTP_URL, stream=True, timeout=10)
#         if response.status_code == 200:
#             bytes_buffer = bytes()
           
#             for chunk in response.iter_content(chunk_size=1024):
#                 bytes_buffer += chunk
#                 a = bytes_buffer.find(b'\xff\xd8')  # Début JPEG
#                 b = bytes_buffer.find(b'\xff\xd9')  # Fin JPEG
               
#                 if a != -1 and b != -1:
#                     jpg_data = bytes_buffer[a:b+2]
#                     img = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)
                   
#                     if img is not None:
#                         filename = f"capture_{int(time.time())}.jpg"
#                         filepath = os.path.join(IMAGE_DIR, filename)
#                         cv2.imwrite(filepath, img)
#                         last_image = filename
#                         return {"status": "success", "file": filename}
       
#         raise RuntimeError("Impossible de capturer une image valide")
 
#     except Exception as e:
#         logger.error(f"Capture Error: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur: {str(e)}. Solutions alternatives:\n"
#                   "1. Vérifiez que le flux HTTP est accessible\n"
#                   "2. Essayez une URL différente (/?action=stream ou /video)\n"
#                   "3. Vérifiez les logs du serveur HTTP"
#         )
 
# @router.get("/api/latest-image")
# async def get_latest_image():
#     """Get the latest captured image"""
#     if not last_image:
#         raise HTTPException(
#             status_code=404,
#             detail="No image captured yet"
#         )
   
#     image_path = os.path.join(IMAGE_DIR, last_image)
#     if not os.path.exists(image_path):
#         raise HTTPException(
#             status_code=410,
#             detail="Image file not found"
#         )
   
#     return FileResponse(image_path)

# # Ajout d'un endpoint pour obtenir le dernier fichier image (sans capturer une nouvelle image)
# @router.get("/get-last-image-file")
# async def get_last_image_file():
#     """Get the last image file without capturing a new one"""
#     global last_image
    
#     if not os.listdir(IMAGE_DIR):
#         raise HTTPException(
#             status_code=404, 
#             detail="Aucune image disponible"
#         )
    
#     # Trier les fichiers par date de création et prendre le plus récent
#     last_image = sorted(os.listdir(IMAGE_DIR))[-1]
#     image_path = os.path.join(IMAGE_DIR, last_image)
    
#     if not os.path.exists(image_path):
#         raise HTTPException(
#             status_code=404,
#             detail="Image non trouvée"
#         )
    
#     return FileResponse(image_path)
 
# @router.get("/test-connection")
# async def test_connection():
#     """Endpoint pour tester la connexion à la caméra"""
#     if test_http_connection():
#         return {"status": "success", "message": "HTTP connection working"}
#     else:
#         raise HTTPException(
#             status_code=503,
#             detail="Could not establish connection to HTTP stream"
#         )



# import os
# import cv2
# import time
# from datetime import datetime
# from fastapi import APIRouter, HTTPException, UploadFile, File, Form
# from fastapi.responses import JSONResponse, FileResponse
# import logging
# import requests
# from io import BytesIO
# import numpy as np

# router = APIRouter(tags=["Camera Capture"])

# # Configuration
# IMAGE_DIR = "static/images"
# os.makedirs(IMAGE_DIR, exist_ok=True)
# HTTP_URL = os.getenv("HTTP_URL", "http://88.185.182.1/webcamlogi")
# last_image = None

# # Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# def test_http_connection():
#     """Teste la connexion HTTP avec timeout"""
#     try:
#         response = requests.get(HTTP_URL, stream=True, timeout=10)
#         return response.status_code == 200
#     except requests.exceptions.RequestException as e:
#         logger.error(f"HTTP Connection Error: {e}")
#         return False

# @router.get("/api/capture")
# async def capture_image():
#     global last_image
   
#     try:
#         # Méthode 1: Essayer d'abord avec OpenCV (pour les flux MJPEG standard)
#         cap = cv2.VideoCapture(HTTP_URL)
#         cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
#         cap.set(cv2.CAP_PROP_FPS, 10)
       
#         start_time = time.time()
#         while not cap.isOpened() and (time.time() - start_time) < 5:
#             time.sleep(0.1)
           
#         if cap.isOpened():
#             ret, frame = cap.read()
#             if ret:
#                 filename = f"capture_{int(time.time())}.jpg"
#                 filepath = os.path.join(IMAGE_DIR, filename)
#                 cv2.imwrite(filepath, frame)
#                 last_image = filename
#                 cap.release()
#                 return {"status": "success", "file": filename}
#             cap.release()
 
#         # Méthode 2: Fallback avec requêtes HTTP manuelles
#         response = requests.get(HTTP_URL, stream=True, timeout=10)
#         if response.status_code == 200:
#             bytes_buffer = bytes()
           
#             for chunk in response.iter_content(chunk_size=1024):
#                 bytes_buffer += chunk
#                 a = bytes_buffer.find(b'\xff\xd8')  # Début JPEG
#                 b = bytes_buffer.find(b'\xff\xd9')  # Fin JPEG
               
#                 if a != -1 and b != -1:
#                     jpg_data = bytes_buffer[a:b+2]
#                     img = cv2.imdecode(np.frombuffer(jpg_data, dtype=np.uint8), cv2.IMREAD_COLOR)
                   
#                     if img is not None:
#                         filename = f"capture_{int(time.time())}.jpg"
#                         filepath = os.path.join(IMAGE_DIR, filename)
#                         cv2.imwrite(filepath, img)
#                         last_image = filename
#                         return {"status": "success", "file": filename}
       
#         raise RuntimeError("Impossible de capturer une image valide")
 
#     except Exception as e:
#         logger.error(f"Capture Error: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur: {str(e)}. Solutions alternatives:\n"
#                   "1. Vérifiez que le flux HTTP est accessible\n"
#                   "2. Essayez une URL différente (/?action=stream ou /video)\n"
#                   "3. Vérifiez les logs du serveur HTTP"
#         )

# @router.get("/api/latest-image")
# async def get_latest_image():
#     """Get the latest captured image"""
#     if not last_image:
#         # Vérifier s'il y a des images dans le répertoire
#         image_files = [f for f in os.listdir(IMAGE_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
#         if not image_files:
#             raise HTTPException(
#                 status_code=404,
#                 detail="No image captured yet"
#             )
#         last_image = sorted(image_files)[-1]
   
#     image_path = os.path.join(IMAGE_DIR, last_image)
#     if not os.path.exists(image_path):
#         raise HTTPException(
#             status_code=410,
#             detail="Image file not found"
#         )
   
#     return FileResponse(image_path)

# # Modifications pour camera_capture.py (paste-2.txt)

# @router.get("/api/latest-image-info")
# async def get_latest_image_info():
#     """Récupère les informations sur la dernière image sans la renvoyer"""
#     try:
#         image_files = [f for f in os.listdir(IMAGE_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
#         if not image_files:
#             raise HTTPException(
#                 status_code=404,
#                 detail="No image captured yet"
#             )
        
#         # Trier par date de modification (plus récente en premier)
#         image_files.sort(key=lambda x: os.path.getmtime(os.path.join(IMAGE_DIR, x)), reverse=True)
#         latest_image = image_files[0]
        
#         # Obtenir des informations sur l'image
#         image_path = os.path.join(IMAGE_DIR, latest_image)
#         stats = os.stat(image_path)
        
#         return {
#             "status": "success",
#             "filename": latest_image,
#             "size": stats.st_size,
#             "modified": datetime.fromtimestamp(stats.st_mtime).isoformat(),
#             "url": f"/api/get-image/{latest_image}"
#         }
    
#     except Exception as e:
#         logger.error(f"Latest Image Info Error: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur lors de la récupération des informations: {str(e)}"
#         )

# @router.post("/api/upload-image")
# async def upload_image(file: UploadFile = File(...)):
#     """Télécharger une image depuis le client"""
#     try:
#         # Créer un nom de fichier unique
#         timestamp = int(time.time())
#         filename = f"upload_{timestamp}{os.path.splitext(file.filename)[1]}"
#         filepath = os.path.join(IMAGE_DIR, filename)
        
#         # Sauvegarder le fichier
#         with open(filepath, "wb") as buffer:
#             content = await file.read()
#             buffer.write(content)
        
#         global last_image
#         last_image = filename
        
#         return {"status": "success", "file": filename}
    
#     except Exception as e:
#         logger.error(f"Upload Error: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur lors du téléchargement: {str(e)}"
#         )

# @router.post("/api/image-from-url")
# async def image_from_url(url: str = Form(...)):
#     """Télécharger une image depuis une URL"""
#     try:
#         response = requests.get(url, timeout=10)
#         if response.status_code != 200:
#             raise HTTPException(
#                 status_code=400, 
#                 detail=f"Impossible de télécharger l'image depuis l'URL. Code: {response.status_code}"
#             )
        
#         # Convertir en image OpenCV
#         img_array = np.frombuffer(response.content, np.uint8)
#         img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
#         if img is None:
#             raise HTTPException(
#                 status_code=400,
#                 detail="Le contenu téléchargé n'est pas une image valide"
#             )
        
#         # Sauvegarder l'image
#         timestamp = int(time.time())
#         filename = f"url_{timestamp}.jpg"
#         filepath = os.path.join(IMAGE_DIR, filename)
#         cv2.imwrite(filepath, img)
        
#         global last_image
#         last_image = filename
        
#         return {"status": "success", "file": filename}
    
#     except requests.exceptions.RequestException as e:
#         logger.error(f"URL Download Error: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur lors du téléchargement depuis l'URL: {str(e)}"
#         )

# @router.get("/api/images-list")
# async def get_images_list():
#     """Liste toutes les images disponibles"""
#     try:
#         image_files = [f for f in os.listdir(IMAGE_DIR) if f.endswith(('.jpg', '.jpeg', '.png'))]
#         image_files.sort(reverse=True)  # Plus récentes en premier
        
#         return {
#             "status": "success", 
#             "images": image_files,
#             "count": len(image_files)
#         }
    
#     except Exception as e:
#         logger.error(f"List Images Error: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Erreur lors de la récupération de la liste des images: {str(e)}"
#         )

# @router.get("/api/get-image/{filename}")
# async def get_specific_image(filename: str):
#     """Récupère une image spécifique par son nom de fichier"""
#     image_path = os.path.join(IMAGE_DIR, filename)
    
#     if not os.path.exists(image_path):
#         raise HTTPException(
#             status_code=404,
#             detail=f"Image {filename} not found"
#         )
    
#     return FileResponse(image_path)

# @router.get("/api/test-connection")
# async def test_connection():
#     """Endpoint pour tester la connexion à la caméra"""
#     if test_http_connection():
#         return {"status": "success", "message": "HTTP connection working"}
#     else:
#         raise HTTPException(
#             status_code=503,
#             detail="Could not establish connection to HTTP stream"
#         )