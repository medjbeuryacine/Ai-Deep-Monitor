import subprocess
from fastapi import APIRouter, HTTPException, Query

# Crée un router pour organiser les routes
router = APIRouter()

import json

@router.get("/api/system-stats")
async def get_system_info():
    """
    Utilise la commande curl pour récupérer les informations système
    de la machine à l'adresse 192.168.1.152/system-stats.
    """
    url = "http://192.168.1.152:8001/system-stats"
    try:
        # Exécuter la commande curl avec subprocess
        result = subprocess.run(
            ["curl", "-s", url],
            text=True,  # Pour retourner une chaîne de caractères
            capture_output=True,  # Capturer stdout et stderr
            check=True  # Lever une exception en cas d'erreur
        )
        # Tenter de convertir la sortie en JSON
        try:
            data = json.loads(result.stdout)  # Si la réponse est déjà au format JSON
        except json.JSONDecodeError:
            # Si la sortie n'est pas un JSON valide, renvoyer une erreur personnalisée
            raise HTTPException(status_code=500, detail="La réponse n'est pas un JSON valide.")
        
        return {"status": "success", "data": data}  # Retourner la réponse au format JSON
    except subprocess.CalledProcessError as e:
        # Gérer les erreurs de la commande
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'exécution de curl : {e.stderr.strip()}"
        ) from e
    except Exception as e:
        # Gérer les autres erreurs
        raise HTTPException(
            status_code=500,
            detail=str(e)
        ) from e