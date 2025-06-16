from fastapi import APIRouter, HTTPException
import requests
import http.client
import json

router = APIRouter(tags=["Compteur"])


GPU_API_HOST = "192.168.1.153"
GPU_API_PORT = 8000

@router.get("/api/compteur")
async def get_compteur():
    try:
        # Établir la connexion avec l'API du GPU
        conn = http.client.HTTPConnection(GPU_API_HOST, GPU_API_PORT)
        
        # Faire la requête GET vers /compteur
        conn.request("GET", "/compteur")
        
        # Récupérer la réponse
        response = conn.getresponse()
        
        # Vérifier si la requête a réussi
        if response.status == 200:
            data = response.read()
            compteur = json.loads(data)
            return compteur
        else:
            raise HTTPException(status_code=response.status, detail="Erreur lors de la récupération du compteur")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Fermer la connexion
        conn.close()

