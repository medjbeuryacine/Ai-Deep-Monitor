from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.templating import Jinja2Templates
import json, os

from code_entree import generate_entree_stream
from code_sortie import generate_sortie_stream

app = FastAPI()
templates = Jinja2Templates(directory="templates")
COMPTEUR_PATH = "compteur.json"

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
