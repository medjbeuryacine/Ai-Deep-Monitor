# from fastapi import APIRouter, HTTPException, Query
# from fastapi.responses import JSONResponse
# import os
# import cv2
# from datetime import datetime
# import json
# from ultralytics import YOLO
# import base64
# import zlib  # Pour la compression

# router = APIRouter(tags=["Detection YOLO"])

# IMAGE_DIR = "static/images"
# LOG_DIR = "logs"

# model_person_object = YOLO("yolov8n.pt")
# model_face = YOLO("yolov11n-face.pt")

# os.makedirs(LOG_DIR, exist_ok=True)

# def compress_base64(data: str) -> str:
#     """Compresse les données base64 en utilisant zlib"""
#     data_bytes = data.encode('utf-8')
#     compressed = zlib.compress(data_bytes)
#     return base64.b64encode(compressed).decode('utf-8')

# def decompress_base64(data: str) -> str:
#     """Décompresse les données base64 compressées"""
#     compressed = base64.b64decode(data.encode('utf-8'))
#     decompressed = zlib.decompress(compressed)
#     return decompressed.decode('utf-8')

# @router.get("/api/process-last-image")
# async def process_last_image(
#     person: bool = Query(True),
#     face: bool = Query(True),
#     object: bool = Query(True),
# ):
#     if not os.listdir(IMAGE_DIR):
#         raise HTTPException(status_code=404, detail="Aucune image disponible")

#     last_image_name = sorted(os.listdir(IMAGE_DIR))[-1]
#     image_path = os.path.join(IMAGE_DIR, last_image_name)

#     if not os.path.exists(image_path):
#         raise HTTPException(status_code=404, detail="Image non trouvée")

#     image = cv2.imread(image_path)
#     original = image.copy()
#     detections_done = []

#     if person or object:
#         results = model_person_object(original, verbose=False)
#         for result in results:
#             for box in result.boxes.data.tolist():
#                 x1, y1, x2, y2, conf, cls = box[:6]
#                 class_id = int(cls)
#                 name = model_person_object.names[class_id]
#                 if (person and name == "person") or (object and name != "person"):
#                     label = f"{name} {conf:.2f}"
#                     cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
#                     cv2.putText(image, label, (int(x1), int(y1) - 10),
#                                 cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
#                     if name not in detections_done:
#                         detections_done.append(name)

#     if face:
#         results = model_face(original, verbose=False)
#         for result in results:
#             for box in result.boxes.data.tolist():
#                 x1, y1, x2, y2, conf, cls = box[:6]
#                 label = f"face {conf:.2f}"
#                 cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
#                 cv2.putText(image, label, (int(x1), int(y1) - 10),
#                             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)
#         if "face" not in detections_done:
#             detections_done.append("face")

#     _, img_encoded = cv2.imencode(".jpg", image)
#     img_base64 = base64.b64encode(img_encoded).decode("utf-8")
    
#     # Compression des données base64
#     compressed_base64 = compress_base64(img_base64)

#     timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

#     log_entry = {
#         "timestamp": timestamp,
#         "detections": detections_done,
#         "image_name": last_image_name,
#         "image_base64_compressed": compressed_base64  # Stockage de la version compressée
#     }

#     log_filename = f"log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
#     with open(os.path.join(LOG_DIR, log_filename), "w") as f:
#         json.dump(log_entry, f, indent=2)

#     # Pour la réponse, vous pouvez choisir de renvoyer les données compressées ou non
#     # Ici, je renvoie les données non compressées pour une utilisation immédiate
#     log_entry_response = log_entry.copy()
#     log_entry_response["image_base64"] = img_base64  # Ajout des données non compressées pour la réponse
#     del log_entry_response["image_base64_compressed"]  # Suppression des données compressées de la réponse
    
#     return JSONResponse(content=log_entry_response)

# @router.get("/api/logs")
# async def get_logs():
#     logs = []
#     for file in sorted(os.listdir(LOG_DIR)):
#         if file.endswith(".json"):
#             with open(os.path.join(LOG_DIR, file)) as f:
#                 log_entry = json.load(f)
#                 # Décompression des données si nécessaire
#                 if "image_base64_compressed" in log_entry:
#                     log_entry["image_base64"] = decompress_base64(log_entry["image_base64_compressed"])
#                     del log_entry["image_base64_compressed"]
#                 logs.append(log_entry)
#     return JSONResponse(content=logs[::-1])





# from fastapi import APIRouter, HTTPException, Query, UploadFile, File
# from fastapi.responses import JSONResponse, FileResponse
# import os
# import cv2
# from datetime import datetime
# import json
# from ultralytics import YOLO
# import base64
# import shutil
# from typing import List, Optional
# import numpy as np

# router = APIRouter(tags=["Detection YOLO"])

# # Configuration des répertoires
# UPLOAD_DIR = "static/uploads"
# RESULT_DIR = "static/results"
# LOG_DIR = "logs"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# os.makedirs(RESULT_DIR, exist_ok=True)
# os.makedirs(LOG_DIR, exist_ok=True)

# # Charger les modèles YOLO
# try:
#     model_person_object = YOLO("yolov8n.pt")
#     model_face = YOLO("yolov11n-face.pt")
# except Exception as e:
#     print(f"Erreur lors du chargement des modèles: {e}")
#     raise

# def process_detections(image, detection_options):
#     """Traite les détections sur une image selon les options"""
#     original = image.copy()
#     detections = []

#     # Détection personnes et objets
#     if detection_options.get("person", True) or detection_options.get("object", True):
#         results = model_person_object(original, verbose=False)
#         for result in results:
#             for box in result.boxes.data.tolist():
#                 x1, y1, x2, y2, conf, cls = box[:6]
#                 class_id = int(cls)
#                 name = model_person_object.names[class_id]
                
#                 if (detection_options.get("person", True) and name == "person") or \
#                    (detection_options.get("object", True) and name != "person"):
#                     color = (0, 255, 0)  # Vert pour personnes/objets
#                     label = f"{name} {conf:.2f}"
                    
#                     cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
#                     cv2.putText(image, label, (int(x1), int(y1) - 10),
#                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                    
#                     detections.append({
#                         "type": name,
#                         "confidence": float(conf),
#                         "bbox": [int(x1), int(y1), int(x2), int(y2)],
#                         "color": [int(c) for c in color]  # Convertir en liste pour JSON
#                     })

#     # Détection visages
#     if detection_options.get("face", True):
#         results = model_face(original, verbose=False)
#         for result in results:
#             for box in result.boxes.data.tolist():
#                 x1, y1, x2, y2, conf, cls = box[:6]
#                 color = (255, 0, 0)  # Bleu pour visages
#                 label = f"face {conf:.2f}"
                
#                 cv2.rectangle(image, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
#                 cv2.putText(image, label, (int(x1), int(y1) - 10),
#                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
#                 detections.append({
#                     "type": "face",
#                     "confidence": float(conf),
#                     "bbox": [int(x1), int(y1), int(x2), int(y2)],
#                     "color": [int(c) for c in color]
#                 })

#     return image, detections

# def save_results(original_filename, image, detections):
#     """Sauvegarde les résultats et crée une entrée de log"""
#     # Sauvegarder l'image avec détections
#     result_filename = f"result_{original_filename}"
#     result_path = os.path.join(RESULT_DIR, result_filename)
#     cv2.imwrite(result_path, image)

#     # Encodage base64 pour la réponse
#     _, img_encoded = cv2.imencode(".jpg", image)
#     img_base64 = base64.b64encode(img_encoded).decode("utf-8")

#     # Création de l'entrée de log
#     timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#     log_entry = {
#         "timestamp": timestamp,
#         "original_image": original_filename,
#         "result_image": result_filename,
#         "detections": detections,
#         "image_base64": img_base64
#     }

#     # Sauvegarde du log
#     log_filename = f"log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
#     with open(os.path.join(LOG_DIR, log_filename), "w") as f:
#         json.dump(log_entry, f, indent=2)

#     return log_entry

# @router.post("/api/upload-and-detect")
# async def upload_and_detect(
#     file: UploadFile = File(...),
#     person: bool = Query(True),
#     face: bool = Query(True),
#     object: bool = Query(True),
# ):
#     """Upload an image and process it with detection"""
#     try:
#         # Sauvegarder le fichier uploadé
#         file_path = os.path.join(UPLOAD_DIR, file.filename)
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)

#         # Lire l'image
#         image = cv2.imread(file_path)
#         if image is None:
#             raise HTTPException(status_code=400, detail="Format d'image non supporté")

#         # Options de détection
#         detection_options = {
#             "person": person,
#             "face": face,
#             "object": object
#         }

#         # Traitement des détections
#         processed_image, detections = process_detections(image, detection_options)

#         # Sauvegarde et réponse
#         log_entry = save_results(file.filename, processed_image, detections)
#         return JSONResponse(content=log_entry)

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/api/list-uploaded-images")
# async def list_uploaded_images():
#     """List all uploaded images available for detection"""
#     try:
#         images = [f for f in os.listdir(UPLOAD_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
#         return {"images": sorted(images, reverse=True)}  # Tri du plus récent au plus ancien
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/api/process-uploaded-image")
# async def process_uploaded_image(
#     filename: str,
#     person: bool = Query(True),
#     face: bool = Query(True),
#     object: bool = Query(True),
# ):
#     """Process an already uploaded image"""
#     try:
#         file_path = os.path.join(UPLOAD_DIR, filename)
#         if not os.path.exists(file_path):
#             raise HTTPException(status_code=404, detail="Image non trouvée")

#         # Lire l'image
#         image = cv2.imread(file_path)
#         if image is None:
#             raise HTTPException(status_code=400, detail="Format d'image non supporté")

#         # Options de détection
#         detection_options = {
#             "person": person,
#             "face": face,
#             "object": object
#         }

#         # Traitement des détections
#         processed_image, detections = process_detections(image, detection_options)

#         # Sauvegarde et réponse
#         log_entry = save_results(filename, processed_image, detections)
#         return JSONResponse(content=log_entry)

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/api/logs")
# async def get_logs(limit: Optional[int] = Query(10)):
#     """Retrieve all detection logs with limit option"""
#     try:
#         log_files = sorted([f for f in os.listdir(LOG_DIR) if f.endswith(".json")], reverse=True)
#         logs = []
        
#         for file in log_files[:limit]:
#             with open(os.path.join(LOG_DIR, file)) as f:
#                 logs.append(json.load(f))
                
#         return JSONResponse(content=logs)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/api/get-image/{image_type}/{filename}")
# async def get_image(image_type: str, filename: str):
#     """Get original or result image by filename"""
#     try:
#         if image_type == "original":
#             dir_path = UPLOAD_DIR
#         elif image_type == "result":
#             dir_path = RESULT_DIR
#         else:
#             raise HTTPException(status_code=400, detail="Type d'image invalide")
        
#         file_path = os.path.join(dir_path, filename)
#         if not os.path.exists(file_path):
#             raise HTTPException(status_code=404, detail="Image non trouvée")
            
#         return FileResponse(file_path)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/api/get-detection-stats")
# async def get_detection_stats():
#     """Get statistics about detections"""
#     try:
#         log_files = [f for f in os.listdir(LOG_DIR) if f.endswith(".json")]
#         stats = {
#             "total_detections": 0,
#             "detection_types": {},
#             "total_images_processed": len(log_files)
#         }
        
#         for file in log_files:
#             with open(os.path.join(LOG_DIR, file)) as f:
#                 log_data = json.load(f)
#                 for detection in log_data.get("detections", []):
#                     stats["total_detections"] += 1
#                     det_type = detection["type"]
#                     stats["detection_types"][det_type] = stats["detection_types"].get(det_type, 0) + 1
                    
#         return JSONResponse(content=stats)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))






from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
import os
import cv2
from datetime import datetime
import json
from ultralytics import YOLO
import base64
import shutil
from typing import List, Optional
import numpy as np

router = APIRouter(tags=["Detection YOLO"])

# Configuration des répertoires
UPLOAD_DIR = "static/uploads"
RESULT_DIR = "static/results"
LOG_DIR = "logs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(RESULT_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# Charger les modèles YOLO
try:
    model_person_object = YOLO("yolov8n.pt")
    model_face = YOLO("yolov11n-face.pt")
except Exception as e:
    print(f"Erreur lors du chargement des modèles: {e}")
    raise

def process_detections(image, detection_options):
    """Traite les détections sur une image selon les options"""
    original = image.copy()
    detections = []
    result_image = original.copy()  # Utilisé uniquement pour la sauvegarde

    # Détection personnes et objets
    if detection_options.get("person", True) or detection_options.get("object", True):
        results = model_person_object(original, verbose=False)
        for result in results:
            for box in result.boxes.data.tolist():
                x1, y1, x2, y2, conf, cls = box[:6]
                class_id = int(cls)
                name = model_person_object.names[class_id]
                
                # Ajouter toutes les détections à la liste, mais dessiner uniquement celles demandées
                if name == "person":
                    color = (0, 255, 0)  # Vert pour personnes
                    if detection_options.get("person", True):
                        cv2.rectangle(result_image, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                        cv2.putText(result_image, f"{name} {conf:.2f}", (int(x1), int(y1) - 10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                else:
                    color = (0, 165, 255)  # Orange pour objets
                    if detection_options.get("object", True):
                        cv2.rectangle(result_image, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                        cv2.putText(result_image, f"{name} {conf:.2f}", (int(x1), int(y1) - 10),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                detections.append({
                    "type": name,
                    "confidence": float(conf),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "color": [int(c) for c in color]
                })

    # Détection visages
    if True:  # Toujours exécuter la détection, filtrage côté client
        results = model_face(original, verbose=False)
        for result in results:
            for box in result.boxes.data.tolist():
                x1, y1, x2, y2, conf, cls = box[:6]
                color = (255, 0, 0)  # Bleu pour visages
                
                if detection_options.get("face", True):
                    cv2.rectangle(result_image, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                    cv2.putText(result_image, f"face {conf:.2f}", (int(x1), int(y1) - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                
                detections.append({
                    "type": "face",
                    "confidence": float(conf),
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "color": [int(c) for c in color]
                })

    return result_image, detections, original  # Retourner aussi l'image originale sans modifications

def save_results(original_filename, image, detections, original_image=None):
    """Sauvegarde les résultats et crée une entrée de log"""
    # Sauvegarder l'image avec détections
    result_filename = f"result_{original_filename}"
    result_path = os.path.join(RESULT_DIR, result_filename)
    cv2.imwrite(result_path, image)

    # Encodage base64 pour la réponse
    # Si on veut envoyer l'image originale au lieu de l'image avec les détections
    img_to_encode = original_image if original_image is not None else image
    _, img_encoded = cv2.imencode(".jpg", img_to_encode)
    img_base64 = base64.b64encode(img_encoded).decode("utf-8")

    # Création de l'entrée de log
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = {
        "timestamp": timestamp,
        "original_image": original_filename,
        "result_image": result_filename,
        "detections": detections,
        "image_base64": img_base64
    }

    # Sauvegarde du log
    log_filename = f"log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(os.path.join(LOG_DIR, log_filename), "w") as f:
        json.dump(log_entry, f, indent=2)

    return log_entry

@router.post("/api/upload-and-detect")
async def upload_and_detect(
    file: UploadFile = File(...),
    person: bool = Query(True),
    face: bool = Query(True),
    object: bool = Query(True),
):
    """Upload an image and process it with detection"""
    try:
        # Sauvegarder le fichier uploadé
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Lire l'image
        image = cv2.imread(file_path)
        if image is None:
            raise HTTPException(status_code=400, detail="Format d'image non supporté")

        # Options de détection
        detection_options = {
            "person": person,
            "face": face,
            "object": object
        }

        # Traitement des détections
        processed_image, detections, original_image = process_detections(image, detection_options)

        # Pour les uploads, nous voulons retourner l'image originale (sans bounding boxes)
        # pour que le frontend gère l'affichage des boxes en fonction des checkboxes
        log_entry = save_results(file.filename, processed_image, detections, original_image)
        return JSONResponse(content=log_entry)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/list-uploaded-images")
async def list_uploaded_images():
    """List all uploaded images available for detection"""
    try:
        images = [f for f in os.listdir(UPLOAD_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        return {"images": sorted(images, reverse=True)}  # Tri du plus récent au plus ancien
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/process-uploaded-image")
async def process_uploaded_image(
    filename: str,
    person: bool = Query(True),
    face: bool = Query(True),
    object: bool = Query(True),
):
    """Process an already uploaded image"""
    try:
        file_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Image non trouvée")

        # Lire l'image
        image = cv2.imread(file_path)
        if image is None:
            raise HTTPException(status_code=400, detail="Format d'image non supporté")

        # Options de détection (toujours activer toutes les détections)
        # Le filtrage sera géré côté client
        detection_options = {
            "person": person,
            "face": face,
            "object": object
        }

        # Traitement des détections
        processed_image, detections, original_image = process_detections(image, detection_options)

        # Renvoyer l'image originale
        log_entry = save_results(filename, processed_image, detections, original_image)
        return JSONResponse(content=log_entry)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/logs")
async def get_logs(
    person: bool = Query(False, description="Filtre pour les détections de personnes"),
    face: bool = Query(False, description="Filtre pour les détections de visages"),
    object: bool = Query(False, description="Filtre pour les détections d'objets"),
    search: Optional[str] = Query(None, description="Terme de recherche dans les détections"),
    start_date: Optional[str] = Query(None, description="Date de début (format YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Date de fin (format YYYY-MM-DD)"),
    limit: Optional[int] = Query(None, description="Nombre maximum de logs à retourner")
):
    """
    Récupère les logs de détection filtrés selon les critères spécifiés.
    
    - Si aucun filtre de type (person, face, object) n'est activé, tous les logs sont retournés
    - Si un ou plusieurs filtres sont activés, seuls les logs contenant ces types de détection sont retournés
    - Le filtre de recherche permet de filtrer par nom spécifique de détection
    - Les filtres de date permettent de limiter les résultats à une période donnée
    """
    try:
        # Récupération de tous les fichiers logs
        log_files = sorted([f for f in os.listdir(LOG_DIR) if f.endswith(".json")], reverse=True)
        all_logs = []
        
        # Lecture de tous les logs
        for file in log_files:
            try:
                with open(os.path.join(LOG_DIR, file)) as f:
                    log_data = json.load(f)
                    all_logs.append(log_data)
            except json.JSONDecodeError:
                # Ignorer les fichiers JSON mal formés
                continue
        
        # Filtrage par types de détection (person, face, object)
        filtered_logs = []
        
        # Si aucun filtre n'est actif, on retourne tous les logs
        if not person and not face and not object:
            filtered_logs = all_logs
        else:
            for log in all_logs:
                # Vérifier chaque type de détection
                has_person = any(det["type"] == "person" for det in log.get("detections", []))
                has_face = any(det["type"] == "face" for det in log.get("detections", []))
                has_other = any(det["type"] not in ["person", "face"] for det in log.get("detections", []))
                
                # Ajouter le log s'il correspond à au moins un des filtres actifs
                if (person and has_person) or (face and has_face) or (object and has_other):
                    filtered_logs.append(log)
        
        # Filtrage par terme de recherche
        if search and search.strip():
            search_term = search.strip().lower()
            filtered_logs = [
                log for log in filtered_logs 
                if any(search_term in det["type"].lower() for det in log.get("detections", []))
            ]
        
        # Filtrage par date
        if start_date:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            filtered_logs = [
                log for log in filtered_logs 
                if datetime.strptime(log["timestamp"].split(" ")[0], "%Y-%m-%d") >= start_datetime
            ]
        
        if end_date:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
            end_datetime = datetime.combine(end_datetime.date(), datetime.max.time())  # Fin de journée
            filtered_logs = [
                log for log in filtered_logs 
                if datetime.strptime(log["timestamp"].split(" ")[0], "%Y-%m-%d") <= end_datetime
            ]
        
        # Limitation du nombre de résultats
        if limit and limit > 0:
            filtered_logs = filtered_logs[:limit]
            
        return JSONResponse(content=filtered_logs)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des logs: {str(e)}")

@router.get("/api/logs/stats")
async def get_logs_stats():
    """Obtenir des statistiques sur les logs de détection"""
    try:
        log_files = [f for f in os.listdir(LOG_DIR) if f.endswith(".json")]
        stats = {
            "total_logs": len(log_files),
            "detection_counts": {
                "person": 0,
                "face": 0,
                "objects": 0
            },
            "detection_types": {}
        }
        
        for file in log_files:
            try:
                with open(os.path.join(LOG_DIR, file)) as f:
                    log_data = json.load(f)
                    
                    for detection in log_data.get("detections", []):
                        det_type = detection["type"]
                        
                        # Incrémenter les compteurs par catégorie principale
                        if det_type == "person":
                            stats["detection_counts"]["person"] += 1
                        elif det_type == "face":
                            stats["detection_counts"]["face"] += 1
                        else:
                            stats["detection_counts"]["objects"] += 1
                        
                        # Compteur par type spécifique
                        stats["detection_types"][det_type] = stats["detection_types"].get(det_type, 0) + 1
                        
            except json.JSONDecodeError:
                # Ignorer les fichiers JSON mal formés
                continue
                
        return JSONResponse(content=stats)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des statistiques: {str(e)}")


@router.get("/api/get-image/{image_type}/{filename}")
async def get_image(image_type: str, filename: str):
    """Get original or result image by filename"""
    try:
        if image_type == "original":
            dir_path = UPLOAD_DIR
        elif image_type == "result":
            dir_path = RESULT_DIR
        else:
            raise HTTPException(status_code=400, detail="Type d'image invalide")
        
        file_path = os.path.join(dir_path, filename)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Image non trouvée")
            
        return FileResponse(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/get-detection-stats")
async def get_detection_stats():
    """Get statistics about detections"""
    try:
        log_files = [f for f in os.listdir(LOG_DIR) if f.endswith(".json")]
        stats = {
            "total_detections": 0,
            "detection_types": {},
            "total_images_processed": len(log_files)
        }
        
        for file in log_files:
            with open(os.path.join(LOG_DIR, file)) as f:
                log_data = json.load(f)
                for detection in log_data.get("detections", []):
                    stats["total_detections"] += 1
                    det_type = detection["type"]
                    stats["detection_types"][det_type] = stats["detection_types"].get(det_type, 0) + 1
                    
        return JSONResponse(content=stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

### USERS LOGS ( A tester avec la nouvelle logspage)

# @router.post("/api/user-action-logs")
# async def log_user_action(action_log: dict):
#     """
#     Enregistre une action utilisateur sur la page de logs
    
#     Le log doit contenir:
#     - action: type d'action ('filter_toggle', 'detection_click')
#     - detail: détail de l'action (nom du filtre ou de la détection)
#     - state: état après l'action (true/false pour activation/désactivation)
#     - timestamp: horodatage de l'action
#     """
#     try:
#         # Créer le répertoire pour les logs utilisateur s'il n'existe pas
#         USER_LOGS_DIR = "user_logs"
#         os.makedirs(USER_LOGS_DIR, exist_ok=True)
        
#         # Nom du fichier basé sur la date du jour
#         log_date = datetime.now().strftime("%Y-%m-%d")
#         log_filename = f"user_actions_{log_date}.json"
#         log_filepath = os.path.join(USER_LOGS_DIR, log_filename)
        
#         # Initialiser ou charger le fichier de logs existant
#         if os.path.exists(log_filepath):
#             with open(log_filepath, "r") as f:
#                 try:
#                     logs = json.load(f)
#                 except json.JSONDecodeError:
#                     logs = []
#         else:
#             logs = []
        
#         # Ajouter le nouveau log avec un horodatage précis
#         action_log["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
#         logs.append(action_log)
        
#         # Enregistrer le fichier mis à jour
#         with open(log_filepath, "w") as f:
#             json.dump(logs, f, indent=2)
        
#         return {"status": "success", "message": "Action utilisateur enregistrée"}
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de l'enregistrement de l'action: {str(e)}")

# @router.get("/api/user-action-logs")
# async def get_user_action_logs(date: Optional[str] = Query(None)):
#     """
#     Récupère les logs d'actions utilisateur pour une date donnée
#     Si aucune date n'est fournie, retourne les logs de la journée en cours
#     """
#     try:
#         USER_LOGS_DIR = "user_logs"
#         os.makedirs(USER_LOGS_DIR, exist_ok=True)
        
#         # Déterminer la date à utiliser
#         log_date = date if date else datetime.now().strftime("%Y-%m-%d")
#         log_filename = f"user_actions_{log_date}.json"
#         log_filepath = os.path.join(USER_LOGS_DIR, log_filename)
        
#         # Vérifier si le fichier existe
#         if not os.path.exists(log_filepath):
#             return {"logs": []}
        
#         # Charger et retourner les logs
#         with open(log_filepath, "r") as f:
#             try:
#                 logs = json.load(f)
#                 return {"logs": logs}
#             except json.JSONDecodeError:
#                 return {"logs": []}
    
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des logs: {str(e)}")





