from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import json, os
from fastapi.middleware.cors import CORSMiddleware
from tracking_entree import generate_frames_entree
from tracking_sortie import generate_frames_sortie



app = FastAPI()


# app.add_middleware(
#   CORSMiddleware,
#   allow_origins=["*"],  # Ou spécifiez votre domaine React
#   allow_methods=["*"],
#   allow_headers=["*"],
#   expose_headers=["*"]  # Important pour les flux
# )

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

VIDEO_DIR = "video_passage"
COMPTEUR_PATH = "compteur.json"


# Réinitialiser le fichier compteur au démarrage
@app.on_event("startup")
def reset_compteur():
    compteur_initial = {"entrances": 0, "sorties": 0, "current_inside": 0}
    with open(COMPTEUR_PATH, "w") as f:
        json.dump(compteur_initial, f, indent=2)
    print("✅ Compteur réinitialisé.")
    print("🚀 API YOLO Entrée/Sortie démarrée sur http://127.0.0.1:8000")



# Route de la page d’accueil
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



# Alias pour les URLs utilisées dans index.html
@app.get("/tracking_entree" , include_in_schema=False)
def tracking_entree():
    return StreamingResponse(generate_frames_entree(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/tracking_sortie", include_in_schema=False)
def tracking_sortie():
    return StreamingResponse(generate_frames_sortie(), media_type="multipart/x-mixed-replace; boundary=frame")


# Retourner le compteur global
@app.get("/compteur", response_class=JSONResponse)
def compteur():
    if os.path.exists(COMPTEUR_PATH):
        with open(COMPTEUR_PATH, "r") as f:
            return JSONResponse(content=json.load(f))
    return JSONResponse(content={"error": "Fichier compteur.json introuvable"}, status_code=404)



if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)