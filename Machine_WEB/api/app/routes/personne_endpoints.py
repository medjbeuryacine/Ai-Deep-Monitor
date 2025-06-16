# from fastapi import APIRouter, HTTPException, Depends
# from datetime import date, datetime, time, timedelta
# import pymysql
# from typing import List, Optional

# ###################################################### PYDANTIC MODELS #################################################################

# from pydantic import BaseModel
# from typing import Optional, Union, List


# class PersonneCreate(BaseModel):
#     nom: str
#     prenom: str
#     sexe: str
#     role: str
#     niveau_autorisation: str
#     autorisation: str
#     zones_acces: Optional[Union[str, List[str]]] = None
#     date_naissance: date
#     plage_horaire_debut: Optional[Union[time, str]] = None
#     plage_horaire_fin: Optional[Union[time, str]] = None
#     badge_actif: bool
#     jours_acces: Optional[str] = None
#     limite_acces_jours: bool = False
    

# class Personne(PersonneCreate):
#     id_personne: int
#     id_hist_pers: Optional[int] = None

#     class Config:
#         orm_mode = True

# ########################################################### API ROUTES ##################################################################

# router = APIRouter(tags=["Personnes"])

# def get_db_connection():
#     try:
#         conn = pymysql.connect(
#             host="mysql",
#             user="user",
#             password="password",
#             database="Configuration",
#             cursorclass=pymysql.cursors.DictCursor,
#             port=3306
#         )
#         return conn
#     except pymysql.Error as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Database connection error: {str(e)}"
#         )

# def get_db():
#     conn = get_db_connection()
#     try:
#         yield conn
#     finally:
#         conn.close()

# @router.get("/api/personnes/", response_model=List[Personne])
# def get_personnes(conn = Depends(get_db)):
#     try:
#         with conn.cursor() as cursor:
#             cursor.execute("""
#                 SELECT 
#                     id_personne, nom, prenom, sexe, role, 
#                     niveau_autorisation, autorisation, zones_acces,
#                     date_naissance, 
#                     plage_horaire_debut,
#                     plage_horaire_fin,
#                     badge_actif, jours_acces, limite_acces_jours,
#                     id_hist_pers, 
#                 FROM Personne
#             """)
#             personnes = cursor.fetchall()
            
#             result = []
#             for row in personnes:
#                 # Convertir les champs nécessaires
#                 row['badge_actif'] = bool(row['badge_actif'])
#                 row['limite_acces_jours'] = bool(row['limite_acces_jours'])
                
#                 # Convertir timedelta en time ou en chaîne de caractères
#                 if row['plage_horaire_debut'] is not None:
#                     if isinstance(row['plage_horaire_debut'], timedelta):
#                         seconds = row['plage_horaire_debut'].total_seconds()
#                         hours, remainder = divmod(seconds, 3600)
#                         minutes, seconds = divmod(remainder, 60)
#                         row['plage_horaire_debut'] = time(int(hours), int(minutes), int(seconds))
                
#                 if row['plage_horaire_fin'] is not None:
#                     if isinstance(row['plage_horaire_fin'], timedelta):
#                         seconds = row['plage_horaire_fin'].total_seconds()
#                         hours, remainder = divmod(seconds, 3600)
#                         minutes, seconds = divmod(remainder, 60)
#                         row['plage_horaire_fin'] = time(int(hours), int(minutes), int(seconds))
                
#                 result.append(Personne(**row))
            
#             return result
#     except pymysql.Error as e:
#         raise HTTPException(
#             status_code=500,
#             detail=f"Error retrieving persons: {str(e)}"
#         )

# @router.post("/api/personnes/", response_model=Personne, status_code=201)
# def create_personne(personne: PersonneCreate, conn = Depends(get_db)):
#     try:
#         with conn.cursor() as cursor:
#             # Conversion des zones d'accès
#             zones_acces = personne.zones_acces
#             if isinstance(zones_acces, list):
#                 zones_acces = ','.join(zones_acces)
            
#             # Conversion des horaires
#             plage_debut = personne.plage_horaire_debut
#             plage_fin = personne.plage_horaire_fin
            
#             if isinstance(plage_debut, time):
#                 plage_debut = plage_debut.strftime("%H:%M:%S")
#             if isinstance(plage_fin, time):
#                 plage_fin = plage_fin.strftime("%H:%M:%S")
            
#             # Insertion dans Historique_Personne
#             current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#             cursor.execute(
#                 "INSERT INTO Historique_Personne (date_modif, champ_modifie) VALUES (%s, %s)",
#                 (current_date, "Person Creation")
#             )
#             id_hist_pers = cursor.lastrowid
            
#             # Insertion dans Personne
#             cursor.execute(
#                 """
#                 INSERT INTO Personne (
#                     nom, prenom, sexe, role, niveau_autorisation, 
#                     autorisation, zones_acces, date_naissance,
#                     plage_horaire_debut, plage_horaire_fin, 
#                     badge_actif, jours_acces, limite_acces_jours,
#                     id_hist_pers
#                 ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#                 """,
#                 (
#                     personne.nom, personne.prenom, personne.sexe, personne.role, 
#                     personne.niveau_autorisation, personne.autorisation,
#                     zones_acces, personne.date_naissance,
#                     plage_debut, plage_fin,
#                     int(personne.badge_actif), personne.jours_acces,
#                     int(personne.limite_acces_jours),
#                     id_hist_pers
#                 )
#             )
            
#             conn.commit()
#             personne_id = cursor.lastrowid
            
#             return Personne(
#                 id_personne=personne_id,
#                 id_hist_pers=id_hist_pers,
#                 **personne.dict()
#             )
    
#     except pymysql.Error as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=400,
#             detail=f"Database error: {str(e)}"
#         )
#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=500,
#             detail=f"Unexpected error: {str(e)}"
#         )

# @router.put("/api/personnes/{personne_id}", response_model=Personne)
# def update_personne(
#     personne_id: int, 
#     personne: PersonneCreate, 
#     conn = Depends(get_db)
# ):
#     try:
#         with conn.cursor() as cursor:
#             # Vérifier si la personne existe
#             cursor.execute(
#                 "SELECT id_personne FROM Personne WHERE id_personne=%s",
#                 (personne_id,)
#             )
#             if not cursor.fetchone():
#                 raise HTTPException(
#                     status_code=404,
#                     detail="Person not found"
#                 )
            
#             # Conversion des zones d'accès
#             zones_acces = personne.zones_acces
#             if isinstance(zones_acces, list):
#                 zones_acces = ','.join(zones_acces)
            
#             # Conversion des horaires
#             plage_debut = personne.plage_horaire_debut
#             plage_fin = personne.plage_horaire_fin
            
#             if isinstance(plage_debut, time):
#                 plage_debut = plage_debut.strftime("%H:%M:%S")
#             if isinstance(plage_fin, time):
#                 plage_fin = plage_fin.strftime("%H:%M:%S")
            
#             # Insertion dans Historique_Personne
#             current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#             cursor.execute(
#                 "INSERT INTO Historique_Personne (date_modif, champ_modifie) VALUES (%s, %s)",
#                 (current_date, f"Update person {personne_id}")
#             )
#             new_hist_pers_id = cursor.lastrowid
            
#             # Mise à jour de la personne
#             cursor.execute(
#                 """
#                 UPDATE Personne 
#                 SET 
#                     nom = %s, 
#                     prenom = %s, 
#                     sexe = %s, 
#                     role = %s, 
#                     niveau_autorisation = %s, 
#                     autorisation = %s,
#                     zones_acces = %s, 
#                     date_naissance = %s, 
#                     plage_horaire_debut = %s, 
#                     plage_horaire_fin = %s, 
#                     badge_actif = %s,
#                     jours_acces = %s,
#                     limite_acces_jours = %s,
#                     id_hist_pers = %s
#                 WHERE id_personne = %s
#                 """,
#                 (
#                     personne.nom, 
#                     personne.prenom, 
#                     personne.sexe, 
#                     personne.role,
#                     personne.niveau_autorisation, 
#                     personne.autorisation,
#                     zones_acces,
#                     personne.date_naissance,
#                     plage_debut,
#                     plage_fin,
#                     int(personne.badge_actif),
#                     personne.jours_acces,
#                     int(personne.limite_acces_jours),
#                     new_hist_pers_id,
#                     personne_id
#                 )
#             )
            
#             conn.commit()
            
#             return Personne(
#                 id_personne=personne_id,
#                 id_hist_pers=new_hist_pers_id,
#                 **personne.dict()
#             )
            
#     except pymysql.Error as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=400,
#             detail=f"Database error: {str(e)}"
#         )
#     except Exception as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=500,
#             detail=f"Unexpected error: {str(e)}"
#         )

# @router.delete("/api/personnes/{personne_id}", status_code=204)
# def delete_personne(personne_id: int, conn = Depends(get_db)):
#     try:
#         with conn.cursor() as cursor:
#             # Vérifier si la personne existe
#             cursor.execute(
#                 "SELECT id_personne FROM Personne WHERE id_personne=%s",
#                 (personne_id,)
#             )
#             if not cursor.fetchone():
#                 raise HTTPException(
#                     status_code=404,
#                     detail="Person not found"
#                 )
            
#             # Récupérer l'id_hist_pers avant suppression
#             cursor.execute(
#                 "SELECT id_hist_pers FROM Personne WHERE id_personne=%s",
#                 (personne_id,)
#             )
#             hist_id = cursor.fetchone()['id_hist_pers']
            
#             # Supprimer la personne
#             cursor.execute(
#                 "DELETE FROM Personne WHERE id_personne=%s",
#                 (personne_id,)
#             )
            
#             # Mettre à jour l'historique
#             current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
#             cursor.execute(
#                 "UPDATE Historique_Personne SET date_modif=%s, champ_modifie=%s WHERE id_hist_pers=%s",
#                 (current_date, f"Person {personne_id} deleted", hist_id)
#             )
            
#             conn.commit()
#             return None
    
#     except pymysql.Error as e:
#         conn.rollback()
#         raise HTTPException(
#             status_code=400,
#             detail=f"Database error: {str(e)}"
#         )



############################################## Une autre api personne avec l'image de la perasonne #######################################################


from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
import pymysql
from typing import List, Optional
import os
import shutil
import uuid
import time as time_module
from datetime import time, date, datetime, timedelta  # Déplacez time au début pour clarifier

###################################################### PYDANTIC MODELS #################################################################

from pydantic import BaseModel
from typing import Optional, Union, List


class PersonneCreate(BaseModel):
    nom: str
    prenom: str
    sexe: str
    role: str
    niveau_autorisation: str
    autorisation: str
    zones_acces: Optional[str] = None
    date_naissance: date
    plage_horaire_debut: Optional[Union[time, str]] = None
    plage_horaire_fin: Optional[Union[time, str]] = None
    badge_actif: bool
    jours_acces: Optional[str] = None
    limite_acces_jours: bool = False
    photo_url: Optional[str] = None
    

class Personne(PersonneCreate):
    id_personne: int
    id_hist_pers: Optional[int] = None

    class Config:
        orm_mode = True

########################################################### API ROUTES ##################################################################

router = APIRouter(tags=["Personnes"])

# Constante pour le répertoire d'upload
UPLOAD_DIR = "/app/uploads"

# Vérifier que le répertoire existe, sinon le créer
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db_connection():
    try:
        conn = pymysql.connect(
            host="mysql",
            user="user",
            password="password",
            database="Configuration",
            cursorclass=pymysql.cursors.DictCursor,
            port=3306
        )
        return conn
    except pymysql.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {str(e)}"
        )

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def create_person_directory(nom, prenom):
    """Crée un dossier pour la personne basé sur son nom et prénom."""
    # Nettoyer le nom et prénom pour éviter les problèmes de chemin
    safe_nom = ''.join(c for c in nom if c.isalnum() or c in [' ', '_']).strip()
    safe_prenom = ''.join(c for c in prenom if c.isalnum() or c in [' ', '_']).strip()
    
    # Remplacer les espaces par des underscores
    safe_nom = safe_nom.replace(' ', '_')
    safe_prenom = safe_prenom.replace(' ', '_')
    
    # Créer le chemin du dossier
    person_dir = os.path.join(UPLOAD_DIR, "personnes_images", f"{safe_nom}_{safe_prenom}")
    
    # Créer le dossier s'il n'existe pas
    os.makedirs(person_dir, exist_ok=True)
    
    return person_dir

@router.get("/api/personnes/", response_model=List[Personne])
def get_personnes(conn = Depends(get_db)):
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    id_personne, nom, prenom, sexe, role, 
                    niveau_autorisation, autorisation, zones_acces,
                    date_naissance, 
                    plage_horaire_debut,
                    plage_horaire_fin,
                    badge_actif, jours_acces, limite_acces_jours,
                    id_hist_pers, photo_url
                FROM Personne
            """)
            personnes = cursor.fetchall()
            
            result = []
            for row in personnes:
                # Convertir les champs nécessaires
                row['badge_actif'] = bool(row['badge_actif'])
                row['limite_acces_jours'] = bool(row['limite_acces_jours'])
                
                # Convertir timedelta en time ou en chaîne de caractères
                if row['plage_horaire_debut'] is not None:
                    if isinstance(row['plage_horaire_debut'], timedelta):
                        seconds = row['plage_horaire_debut'].total_seconds()
                        hours, remainder = divmod(seconds, 3600)
                        minutes, seconds = divmod(remainder, 60)
                        row['plage_horaire_debut'] = time(int(hours), int(minutes), int(seconds))
                    elif isinstance(row['plage_horaire_debut'], str):
                        parts = row['plage_horaire_debut'].split(':')
                        row['plage_horaire_debut'] = time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
                
                if row['plage_horaire_fin'] is not None:
                    if isinstance(row['plage_horaire_fin'], timedelta):
                        seconds = row['plage_horaire_fin'].total_seconds()
                        hours, remainder = divmod(seconds, 3600)
                        minutes, seconds = divmod(remainder, 60)
                        row['plage_horaire_fin'] = time(int(hours), int(minutes), int(seconds))
                    elif isinstance(row['plage_horaire_fin'], str):
                        parts = row['plage_horaire_fin'].split(':')
                        row['plage_horaire_fin'] = time(int(parts[0]), int(parts[1]), int(parts[2]) if len(parts) > 2 else 0)
                
                
                result.append(Personne(**row))
            
            return result
    except pymysql.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving persons: {str(e)}"
        )



@router.get("/api/personnes/photo/{personne_id}")
def get_photo(personne_id: int, conn = Depends(get_db)):
    try:
        with conn.cursor() as cursor:
            print(f"DEBUG: Fetching photo for personne_id={personne_id}")
            cursor.execute(
                "SELECT id_personne, photo_url, nom, prenom FROM Personne WHERE id_personne=%s",
                (personne_id,)
            )
            result = cursor.fetchone()
            print(f"DEBUG: Query result={result}")
            
            # Check if result is None or if no photo_url exists
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Person with ID {personne_id} not found"
                )
                
            if not result['photo_url']:
                raise HTTPException(
                    status_code=404,
                    detail=f"No photo found for person with ID {personne_id}"
                )
            
            person_dir = create_person_directory(result['nom'], result['prenom'])
            print(f"DEBUG: person_dir={person_dir}")
            photo_path = os.path.join(person_dir, result['photo_url'])
            print(f"DEBUG: photo_path={photo_path}")
            
            if not os.path.exists(photo_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"Photo file not found at {photo_path}"
                )
            
            print(f"DEBUG: Photo found, serving file")
            response = FileResponse(
                photo_path,
                headers={
                    "Cache-Control": "no-store, no-cache, must-revalidate",
                    "Pragma": "no-cache",
                    "Expires": "0",
                    "Last-Modified": datetime.now().strftime("%a, %d %b %Y %H:%M:%S GMT")
                }
            )
            
            return response
    
    except pymysql.Error as e:
        print(f"ERROR: Database error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        print(f"ERROR: Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
    

@router.post("/api/personnes/", response_model=Personne, status_code=201)
async def create_personne(
    nom: str = Form(...),
    prenom: str = Form(...),
    sexe: str = Form(...),
    role: str = Form(...),
    niveau_autorisation: str = Form(...),
    autorisation: str = Form(...),
    zones_acces: Optional[str] = Form(None),
    date_naissance: date = Form(...),
    plage_horaire_debut: Optional[str] = Form(None),
    plage_horaire_fin: Optional[str] = Form(None),
    badge_actif: bool = Form(False),
    jours_acces: Optional[str] = Form(None),
    limite_acces_jours: bool = Form(False),
    photo: Optional[UploadFile] = File(None),
    conn = Depends(get_db)
):
    try:
        # Ajouter ces lignes pour logger les valeurs reçues
        print("DEBUG - Received values:")
        print(f"plage_horaire_debut: {plage_horaire_debut}, type: {type(plage_horaire_debut)}")
        print(f"plage_horaire_fin: {plage_horaire_fin}, type: {type(plage_horaire_fin)}")
        
        # Gérer l'upload de la photo si elle existe
        photo_url = None
        if photo and photo.filename:
            # Créer un dossier pour la personne
            person_dir = create_person_directory(nom, prenom)
            
            # Générer un nom de fichier unique avec timestamp
            timestamp = int(time_module.time())
            file_extension = os.path.splitext(photo.filename)[1] or ".jpg"
            photo_filename = f"photo_{timestamp}{file_extension}"
            
            photo_path = os.path.join(person_dir, photo_filename)
            
            # Sauvegarder le fichier
            with open(photo_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
            
            photo_url = photo_filename
        
        # Convertir les plages horaires de chaînes en objets time
        plage_debut_obj = None
        if plage_horaire_debut:
            try:
                # Conversion de la chaîne en objet time
                parts = plage_horaire_debut.split(':')
                if len(parts) < 2:
                    raise ValueError("Format incorrect")
                hour = int(parts[0])
                minute = int(parts[1])
                second = int(parts[2]) if len(parts) > 2 else 0
                if hour < 0 or hour > 23 or minute < 0 or minute > 59 or second < 0 or second > 59:
                    raise ValueError("Valeurs hors limites")
                print(f"DEBUG: Creating time object with hour={hour}, minute={minute}, second={second}")
                plage_debut_obj = time(hour, minute, second)
            except (ValueError, IndexError, TypeError) as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Format d'heure invalide pour plage_horaire_debut: {str(e)}. Format attendu: 'HH:MM' ou 'HH:MM:SS'"
                )
              
        plage_fin_obj = None
        if plage_horaire_fin:
            try:
                # Conversion de la chaîne en objet time
                parts = plage_horaire_fin.split(':')
                if len(parts) < 2:
                    raise ValueError("Format incorrect")
                hour = int(parts[0])
                minute = int(parts[1])
                second = int(parts[2]) if len(parts) > 2 else 0
                if hour < 0 or hour > 23 or minute < 0 or minute > 59 or second < 0 or second > 59:
                    raise ValueError("Valeurs hors limites")
                print(f"DEBUG: Creating time object with hour={hour}, minute={minute}, second={second}")
                plage_fin_obj = time(hour, minute, second)
            except (ValueError, IndexError, TypeError) as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Format d'heure invalide pour plage_horaire_fin: {str(e)}. Format attendu: 'HH:MM' ou 'HH:MM:SS'"
                )
                        
        
        # Créer l'objet PersonneCreate
        personne_data = {
            "nom": nom,
            "prenom": prenom,
            "sexe": sexe,
            "role": role,
            "niveau_autorisation": niveau_autorisation,
            "autorisation": autorisation,
            "zones_acces": zones_acces,
            "date_naissance": date_naissance,
            "plage_horaire_debut": plage_debut_obj,  # Utiliser l'objet time converti
            "plage_horaire_fin": plage_fin_obj,      # Utiliser l'objet time converti
            "badge_actif": badge_actif,
            "jours_acces": jours_acces,
            "limite_acces_jours": limite_acces_jours,
            "photo_url": photo_url
        }
        
        with conn.cursor() as cursor:
            # Insertion dans Historique_Personne
            current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO Historique_Personne (date_modif, champ_modifie) VALUES (%s, %s)",
                (current_date, "Person Creation")
            )
            id_hist_pers = cursor.lastrowid
            
            # Insertion dans Personne
            cursor.execute(
                """
                INSERT INTO Personne (
                    nom, prenom, sexe, role, niveau_autorisation, 
                    autorisation, zones_acces, date_naissance,
                    plage_horaire_debut, plage_horaire_fin, 
                    badge_actif, jours_acces, limite_acces_jours,
                    id_hist_pers, photo_url
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    nom, prenom, sexe, role, 
                    niveau_autorisation, autorisation,
                    zones_acces, date_naissance,
                    plage_debut_obj, plage_fin_obj,  # Utiliser les objets time convertis
                    1 if badge_actif else 0, jours_acces,
                    int(limite_acces_jours),
                    id_hist_pers, photo_url
                )
            )
            
            conn.commit()
            personne_id = cursor.lastrowid
            
            return Personne(
                id_personne=personne_id,
                id_hist_pers=id_hist_pers,
                **personne_data
            )
    
    except pymysql.Error as e:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.put("/api/personnes/{personne_id}", response_model=Personne)
async def update_personne(
    personne_id: int,
    nom: str = Form(...),
    prenom: str = Form(...),
    sexe: str = Form(...),
    role: str = Form(...),
    niveau_autorisation: str = Form(...),
    autorisation: str = Form(...),
    zones_acces: Optional[str] = Form(None),
    date_naissance: date = Form(...),
    plage_horaire_debut: Optional[str] = Form(None),
    plage_horaire_fin: Optional[str] = Form(None),
    badge_actif: bool = Form(False),
    jours_acces: Optional[str] = Form(None),
    limite_acces_jours: bool = Form(False),
    photo: Optional[UploadFile] = File(None),
    conn = Depends(get_db)
):
    try:
        with conn.cursor() as cursor:
            # Vérifier si la personne existe
            cursor.execute(
                "SELECT id_personne, nom, prenom, photo_url FROM Personne WHERE id_personne=%s",
                (personne_id,)
            )
            person = cursor.fetchone()
            if not person:
                raise HTTPException(
                    status_code=404,
                    detail="Person not found"
                )
            
            # Vérifier si le nom ou prénom a changé
            old_nom = person['nom']
            old_prenom = person['prenom']
            nom_changed = old_nom != nom or old_prenom != prenom
            
            # Ancien répertoire et nouveau répertoire
            old_person_dir = create_person_directory(old_nom, old_prenom)
            new_person_dir = create_person_directory(nom, prenom) if nom_changed else old_person_dir
            
            # Gérer l'upload de la photo si elle existe
            photo_url = person['photo_url']  # Conserver l'ancienne photo par défaut
            
            if photo and photo.filename:
                # Supprimer l'ancienne photo si elle existe
                if photo_url and os.path.exists(os.path.join(old_person_dir, photo_url)):
                    try:
                        os.remove(os.path.join(old_person_dir, photo_url))
                    except OSError:
                        pass  # Ignorer les erreurs de suppression
                
                # Générer un nom de fichier unique avec timestamp
                timestamp = int(time_module.time())
                file_extension = os.path.splitext(photo.filename)[1] or ".jpg"
                photo_filename = f"photo_{timestamp}{file_extension}"
                
                photo_path = os.path.join(new_person_dir, photo_filename)
                
                # Sauvegarder le fichier
                with open(photo_path, "wb") as buffer:
                    shutil.copyfileobj(photo.file, buffer)
                
                photo_url = photo_filename
            elif nom_changed and photo_url:
                # Si le nom a changé et il y a une photo existante, déplacer la photo
                old_photo_path = os.path.join(old_person_dir, photo_url)
                new_photo_path = os.path.join(new_person_dir, photo_url)
                
                # Déplacer la photo si elle existe
                if os.path.exists(old_photo_path):
                    try:
                        # S'assurer que le dossier de destination existe
                        os.makedirs(os.path.dirname(new_photo_path), exist_ok=True)
                        # Copier la photo dans le nouveau dossier
                        shutil.copy2(old_photo_path, new_photo_path)
                        # Supprimer l'ancien fichier
                        os.remove(old_photo_path)
                    except OSError as e:
                        print(f"Erreur lors du déplacement de la photo: {str(e)}")
                        # Ne pas ignorer silencieusement, mais continuer le processus
            
            # Convertir les plages horaires de chaînes en objets time
            plage_debut_obj = None
            if plage_horaire_debut:
                try:
                    # Conversion de la chaîne en objet time
                    parts = plage_horaire_debut.split(':')
                    hour = int(parts[0])
                    minute = int(parts[1])
                    second = int(parts[2]) if len(parts) > 2 else 0
                    plage_debut_obj = time(hour, minute, second)
                except (ValueError, IndexError):
                    raise HTTPException(
                        status_code=400, 
                        detail="Format d'heure invalide pour plage_horaire_debut. Format attendu: 'HH:MM' ou 'HH:MM:SS'"
                    )

            plage_fin_obj = None
            if plage_horaire_fin:
                try:
                    # Conversion de la chaîne en objet time
                    parts = plage_horaire_fin.split(':')
                    hour = int(parts[0])
                    minute = int(parts[1])
                    second = int(parts[2]) if len(parts) > 2 else 0
                    plage_fin_obj = time(hour, minute, second)
                except (ValueError, IndexError):
                    raise HTTPException(
                        status_code=400, 
                        detail="Format d'heure invalide pour plage_horaire_fin. Format attendu: 'HH:MM' ou 'HH:MM:SS'"
                    )
            
            # Insertion dans Historique_Personne
            current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO Historique_Personne (date_modif, champ_modifie) VALUES (%s, %s)",
                (current_date, f"Update person {personne_id}")
            )
            new_hist_pers_id = cursor.lastrowid
            
            # Mise à jour de la personne
            cursor.execute(
                """
                UPDATE Personne 
                SET 
                    nom = %s, 
                    prenom = %s, 
                    sexe = %s, 
                    role = %s, 
                    niveau_autorisation = %s, 
                    autorisation = %s,
                    zones_acces = %s, 
                    date_naissance = %s, 
                    plage_horaire_debut = %s, 
                    plage_horaire_fin = %s, 
                    badge_actif = %s,
                    jours_acces = %s,
                    limite_acces_jours = %s,
                    id_hist_pers = %s,
                    photo_url = %s
                WHERE id_personne = %s
                """,
                (
                    nom, 
                    prenom, 
                    sexe, 
                    role,
                    niveau_autorisation, 
                    autorisation,
                    zones_acces,
                    date_naissance,
                    plage_debut_obj,  # Utiliser l'objet time converti
                    plage_fin_obj,    # Utiliser l'objet time converti
                    1 if badge_actif else 0,
                    jours_acces,
                    int(limite_acces_jours),
                    new_hist_pers_id,
                    photo_url,
                    personne_id
                )
            )
            
            conn.commit()
            
            personne_data = {
                "nom": nom,
                "prenom": prenom,
                "sexe": sexe,
                "role": role,
                "niveau_autorisation": niveau_autorisation,
                "autorisation": autorisation,
                "zones_acces": zones_acces,
                "date_naissance": date_naissance,
                "plage_horaire_debut": plage_debut_obj,  # Utiliser l'objet time converti
                "plage_horaire_fin": plage_fin_obj,      # Utiliser l'objet time converti
                "badge_actif": badge_actif,
                "jours_acces": jours_acces,
                "limite_acces_jours": limite_acces_jours,
                "photo_url": photo_url
            }
            
            return Personne(
                id_personne=personne_id,
                id_hist_pers=new_hist_pers_id,
                **personne_data
            )
            
    except pymysql.Error as e:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )

@router.delete("/api/personnes/{personne_id}", status_code=204)
def delete_personne(personne_id: int, conn = Depends(get_db)):
    try:
        with conn.cursor() as cursor:
            # Vérifier si la personne existe et récupérer les informations nécessaires
            cursor.execute(
                "SELECT id_personne, id_hist_pers, nom, prenom, photo_url FROM Personne WHERE id_personne=%s",
                (personne_id,)
            )
            person = cursor.fetchone()
            if not person:
                raise HTTPException(
                    status_code=404,
                    detail="Person not found"
                )
            
            hist_id = person['id_hist_pers']
            nom = person['nom']
            prenom = person['prenom']
            photo_url = person['photo_url']
            
            # Supprimer la personne
            cursor.execute(
                "DELETE FROM Personne WHERE id_personne=%s",
                (personne_id,)
            )
            
            # Mettre à jour l'historique
            current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "UPDATE Historique_Personne SET date_modif=%s, champ_modifie=%s WHERE id_hist_pers=%s",
                (current_date, f"Person {personne_id} deleted", hist_id)
            )
            
            conn.commit()
            
            # Supprimer la photo et éventuellement le dossier si la personne a une photo
            person_dir = create_person_directory(nom, prenom)
            if os.path.exists(person_dir):
                try:
                    # Utiliser shutil.rmtree pour supprimer le dossier et tout son contenu
                    shutil.rmtree(person_dir)
                    print(f"Dossier supprimé avec succès: {person_dir}")
                except OSError as e:
                    print(f"Erreur lors de la suppression du dossier {person_dir}: {str(e)}")
            
            return None
    
    except pymysql.Error as e:
        conn.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Database error: {str(e)}"
        )