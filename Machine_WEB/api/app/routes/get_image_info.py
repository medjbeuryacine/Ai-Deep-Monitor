from fastapi import APIRouter, HTTPException
import os
import json
from ultralytics import YOLO
 
router = APIRouter(tags=["Get Image YOLO"])
 
# Dossiers des images et JSON
IMAGE_DIR = "static/images"
JSON_DIR = "static/json"
 
# Vérifier si le dossier JSON existe, sinon le créer
os.makedirs(JSON_DIR, exist_ok=True)
 
# Charger le modèle YOLOv8 pré-entraîné
model = YOLO("yolov8n.pt")  # Modèle léger 'nano'
 
@router.get("/get-image-info")
async def get_image_info():
    """Analyse la dernière image avec YOLOv8, enregistre et renvoie les résultats en JSON."""
   
    if not os.listdir(IMAGE_DIR):
        raise HTTPException(status_code=404, detail="Aucune image disponible")
 
    last_image_name = sorted(os.listdir(IMAGE_DIR))[-1]
    image_path = os.path.join(IMAGE_DIR, last_image_name)
 
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image non trouvée")
 
    # Exécuter l'inférence avec YOLOv8
    results = model(image_path)
 
    # Extraire les informations des détections
    detections = []
    for result in results:
        for box in result.boxes.data.tolist():  # [x1, y1, x2, y2, confidence, class]
            x1, y1, x2, y2, conf, cls = box
            detections.append({
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
                "confidence": conf,
                "class_id": int(cls),
                "class_name": model.names[int(cls)]
            })
 
    # Créer un fichier JSON avec le même nom que l'image
    json_filename = os.path.splitext(last_image_name)[0] + ".json"
    json_path = os.path.join(JSON_DIR, json_filename)
 
    # Sauvegarde des résultats en JSON
    with open(json_path, "w") as json_file:
        json.dump({"image_name": last_image_name, "detections": detections}, json_file, indent=4)
 
    return {
        "message": "Résultats enregistrés",
        "json_file": json_path,
        "image_name": last_image_name,
        "detections": detections
    }