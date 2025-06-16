# === api.py fusionné avec reset compteur au démarrage ===
from fastapi import FastAPI, Request, Form , Query
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import json, os, cv2, base64
from code_sortie import generate_sortie_stream
from code_entree import generate_entree_stream



def generate_zone_template(request: Request):
    video = os.path.join(VIDEO_DIR, "camera_entree_lumi_normal.mp4")
    
    if not os.path.exists(video):
        return HTMLResponse("<h1>Vidéo spécifiée introuvable</h1>", status_code=404)
    
    cap = cv2.VideoCapture(video)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        return HTMLResponse("<h1>Erreur lors de l'ouverture de la vidéo</h1>", status_code=500)
    
    _, buffer = cv2.imencode(".jpg", frame)
    frame_b64 = base64.b64encode(buffer).decode("utf-8")

    video_name = os.path.basename(video)
    zone_path = f"zones/zone_{video_name}.json"
    zone_points = []

    if os.path.exists(zone_path):
        with open(zone_path) as f:
            zone_points = json.load(f)

    return templates.TemplateResponse("dessiner_zone.html", {
        "request": request,
        "frame_data": frame_b64,
        "video_name": video_name,
        "zone_points": zone_points,
        "video_list": [video_name]
    })


app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

COMPTEUR_PATH = "compteur.json"
VIDEO_DIR = "video_passage"

# Réinitialiser le fichier compteur au démarrage
@app.on_event("startup")
def reset_compteur():
    compteur_initial = {"entrances": 0, "sorties": 0, "current_inside": 0}
    with open(COMPTEUR_PATH, "w") as f:
        json.dump(compteur_initial, f, indent=2)

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    with open(COMPTEUR_PATH, "r") as f:
        compteur = json.load(f)
    return templates.TemplateResponse("index.html", {
        "request": request,
        "entrances": compteur["entrances"],
        "sorties": compteur["sorties"],
        "current": compteur["current_inside"]
    })

@app.get("/video_entree")
def video_entree():
    return StreamingResponse(generate_entree_stream(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/video_sortie")
def video_sortie():
    return StreamingResponse(generate_sortie_stream(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/compteur")
def compteur():
    if os.path.exists(COMPTEUR_PATH):
        with open(COMPTEUR_PATH, "r") as f:
            return JSONResponse(content=json.load(f))
    return JSONResponse(content={"error": "Fichier compteur.json introuvable"}, status_code=404)

# @app.get("/dessiner-zone-entree", response_class=HTMLResponse)
# def dessiner_zone_entree(request: Request):
#     return generate_zone_template(request)

# @app.get("/api/capture-frame")
# def capture_frame():
#     try:
#         video_path = os.path.join(VIDEO_DIR, "camera_entree_lumi_normal.mp4")
        
#         if not os.path.exists(video_path):
#             return JSONResponse(content={"error": "Vidéo non trouvée"}, status_code=404)

#         cap = cv2.VideoCapture(video_path)
#         ret, frame = cap.read()
#         cap.release()

#         if not ret:
#             return JSONResponse(content={"error": "Impossible de lire la vidéo"}, status_code=500)

#         # Enregistre la frame comme image JPG sur disque
#         cv2.imwrite(OUTPUT_IMAGE_PATH, frame)

#         # Encode aussi en base64 si jamais tu veux tester depuis ici
#         with open(OUTPUT_IMAGE_PATH, "rb") as image_file:
#             image_data = image_file.read()
#         frame_data = base64.b64encode(image_data).decode("utf-8")

#         return JSONResponse(content={"success": True, "frame": frame_data})

#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)

# @app.post("/sauver-zone")
# def sauver_zone(points: str = Form(...), video_name: str = Form(...)):
#     try:
#         zone = json.loads(points)
#         output_file = f"zones/zone_{video_name}.json"
#         os.makedirs("zones", exist_ok=True)
#         with open(output_file, "w") as f:
#             json.dump(zone, f, indent=2)
#         return {"status": "ok", "saved_to": output_file}
#     except Exception as e:
#         return JSONResponse(status_code=400, content={"error": str(e)})


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)