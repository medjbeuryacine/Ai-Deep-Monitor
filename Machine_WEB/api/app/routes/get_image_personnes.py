from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, status, Query
from fastapi.responses import FileResponse
import os
import shutil
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import pymysql

router = APIRouter(tags=["Personnes - Gestion des images"])

# Configuration
BASE_UPLOAD_DIR = "/app/uploads"
IMAGES_SUBDIR = "images"  # Sous-dossier pour les images supplémentaires
UNKNOWN_DIR = "inconnu"   # Dossier inconnu pour les images temporaires
PERSONNES_IMAGES_DIR = "personnes_images"  # Nouveau sous-dossier principal

def init_directories():
    """Initialise les dossiers nécessaires au démarrage"""
    # Créer le dossier uploads s'il n'existe pas
    os.makedirs(BASE_UPLOAD_DIR, exist_ok=True)
    # Créer le dossier personnes_images
    personnes_dir = os.path.join(BASE_UPLOAD_DIR, PERSONNES_IMAGES_DIR)
    os.makedirs(personnes_dir, exist_ok=True)
    # Créer le dossier inconnu
    unknown_dir = os.path.join(BASE_UPLOAD_DIR, UNKNOWN_DIR)
    os.makedirs(unknown_dir, exist_ok=True)
    print(f"Dossiers créés: {personnes_dir}, {unknown_dir}")

# Créer les dossiers au démarrage
init_directories()

# Modèles Pydantic
class PersonImageResponse(BaseModel):
    person_id: int
    person_name: str
    main_photo: Optional[str] = None  # Photo principale
    additional_images: List[str]  # Photos supplémentaires
    images_dir: str  # Chemin complet du dossier images

class ImageOperationResponse(BaseModel):
    message: str
    person_id: int
    image_name: str
    image_path: str

class BatchImageOperationResponse(BaseModel):
    message: str
    person_id: int
    image_count: int
    image_names: List[str]

class UnknownImagesResponse(BaseModel):
    images: List[str]
    images_dir: str

class ImageMoveResponse(BaseModel):
    message: str
    source_path: str
    destination_path: str
    person_id: int

# Fonction pour obtenir la connexion à la DB
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

# Fonctions utilitaires
def get_person_dir(person_id: int, conn = None) -> str:
    """Retourne le chemin du dossier de la personne"""
    if conn is None:
        # Créer une connexion temporaire si non fournie
        temp_conn = get_db_connection()
        try:
            cursor = temp_conn.cursor()
            cursor.execute(
                "SELECT nom, prenom FROM Personne WHERE id_personne=%s",
                (person_id,)
            )
            person = cursor.fetchone()
        finally:
            temp_conn.close()
    else:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT nom, prenom FROM Personne WHERE id_personne=%s",
                (person_id,)
            )
            person = cursor.fetchone()
    
    if not person:
        raise HTTPException(
            status_code=404,
            detail=f"Personne avec l'ID {person_id} non trouvée"
        )
    
    # Crée le nom de dossier
    safe_nom = ''.join(c for c in person['nom'] if c.isalnum() or c in [' ', '_']).strip().replace(' ', '_')
    safe_prenom = ''.join(c for c in person['prenom'] if c.isalnum() or c in [' ', '_']).strip().replace(' ', '_')
    return os.path.join(BASE_UPLOAD_DIR, PERSONNES_IMAGES_DIR, f"{safe_nom}_{safe_prenom}")

def get_images_dir(person_dir: str) -> str:
    """Retourne le chemin du sous-dossier images, le crée s'il n'existe pas"""
    images_dir = os.path.join(person_dir, IMAGES_SUBDIR)
    os.makedirs(images_dir, exist_ok=True)
    return images_dir

def get_unknown_dir() -> str:
    """Retourne le chemin du dossier inconnu, le crée s'il n'existe pas"""
    unknown_dir = os.path.join(BASE_UPLOAD_DIR, UNKNOWN_DIR)
    os.makedirs(unknown_dir, exist_ok=True)
    return unknown_dir

def get_main_photo_path(person_id: int, conn) -> Optional[str]:
    """Retourne le chemin de la photo principale si elle existe"""
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT nom, prenom, photo_url FROM Personne WHERE id_personne=%s",
            (person_id,)
        )
        person = cursor.fetchone()
        if not person or not person['photo_url']:
            return None
            
        # Utiliser get_person_dir qui inclut maintenant le sous-dossier personnes_images
        person_dir = get_person_dir(person_id, conn)
        return os.path.join(person_dir, person['photo_url'])

# Routes API
@router.post("/api/personnes/{person_id}/images/", 
             response_model=ImageOperationResponse,
             status_code=status.HTTP_201_CREATED)
async def upload_person_image(
    person_id: int,
    file: UploadFile = File(...),
    conn = Depends(get_db)
):
    """Ajoute une image supplémentaire pour une personne"""
    person_dir = get_person_dir(person_id, conn)
    images_dir = get_images_dir(person_dir)
    
    # Générer un nom de fichier unique
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    new_filename = f"img_{timestamp}{file_ext}"
    file_path = os.path.join(images_dir, new_filename)
    
    # Sauvegarder le fichier
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement de l'image: {str(e)}"
        )
    
    return ImageOperationResponse(
        message="Image ajoutée avec succès",
        person_id=person_id,
        image_name=new_filename,
        image_path=file_path
    )

# Nouvelle route pour l'upload de plusieurs images
@router.post("/api/personnes/{person_id}/images/batch/", 
             response_model=BatchImageOperationResponse,
             status_code=status.HTTP_201_CREATED)
async def upload_multiple_person_images(
    person_id: int,
    files: List[UploadFile] = File(...),
    conn = Depends(get_db)
):
    """Ajoute plusieurs images supplémentaires pour une personne en une seule requête"""
    person_dir = get_person_dir(person_id, conn)
    images_dir = get_images_dir(person_dir)
    
    uploaded_filenames = []
    
    try:
        for file in files:
            # Générer un nom de fichier unique avec un timestamp précis (millisecondes)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:19]  # inclut millisecondes
            file_ext = os.path.splitext(file.filename)[1] or ".jpg"
            new_filename = f"img_{timestamp}{file_ext}"
            file_path = os.path.join(images_dir, new_filename)
            
            # Sauvegarder le fichier
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            uploaded_filenames.append(new_filename)
                
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement des images: {str(e)}"
        )
    
    return BatchImageOperationResponse(
        message=f"{len(uploaded_filenames)} images ajoutées avec succès",
        person_id=person_id,
        image_count=len(uploaded_filenames),
        image_names=uploaded_filenames
    )

@router.get("/api/personnes/{person_id}/images/", 
            response_model=PersonImageResponse)
def get_person_images(person_id: int, conn = Depends(get_db)):
    """Récupère toutes les images d'une personne (photo principale + images supplémentaires)"""
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT id_personne, nom, prenom, photo_url FROM Personne WHERE id_personne=%s",
            (person_id,)
        )
        person = cursor.fetchone()
        if not person:
            raise HTTPException(
                status_code=404,
                detail=f"Personne avec l'ID {person_id} non trouvée"
            )
    
    person_name = f"{person['prenom']} {person['nom']}"
    person_dir = get_person_dir(person_id, conn)
    images_dir = get_images_dir(person_dir)
    
    # Photo principale
    main_photo = None
    if person['photo_url']:
        main_photo_path = os.path.join(person_dir, person['photo_url'])
        if os.path.exists(main_photo_path):
            main_photo = person['photo_url']
    
    # Images supplémentaires
    additional_images = []
    if os.path.exists(images_dir):
        for file in os.listdir(images_dir):
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                additional_images.append(file)
    
    return PersonImageResponse(
        person_id=person_id,
        person_name=person_name,
        main_photo=main_photo,
        additional_images=additional_images,
        images_dir=images_dir
    )

@router.delete("/api/personnes/{person_id}/images/{image_name}", 
               response_model=ImageOperationResponse)
def delete_person_image(
    person_id: int, 
    image_name: str,
    conn = Depends(get_db)
):
    """Supprime une image supplémentaire d'une personne"""
    person_dir = get_person_dir(person_id, conn)
    images_dir = get_images_dir(person_dir)
    file_path = os.path.join(images_dir, image_name)
    
    # Vérifier si le fichier existe
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image {image_name} non trouvée pour la personne {person_id}"
        )
    
    try:
        os.remove(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la suppression de l'image: {str(e)}"
        )
    
    return ImageOperationResponse(
        message="Image supprimée avec succès",
        person_id=person_id,
        image_name=image_name,
        image_path=file_path
    )

@router.delete("/api/personnes/{person_id}/main_photo/", 
               response_model=ImageOperationResponse)
def delete_main_photo(
    person_id: int,
    conn = Depends(get_db)
):
    """Supprime la photo principale d'une personne (et met à jour la DB)"""
    # Récupérer le chemin de la photo principale
    main_photo_path = get_main_photo_path(person_id, conn)
    if not main_photo_path or not os.path.exists(main_photo_path):
        raise HTTPException(
            status_code=404,
            detail="Cette personne n'a pas de photo principale ou elle est déjà supprimée"
        )
    
    try:
        # Supprimer le fichier
        file_name = os.path.basename(main_photo_path)
        os.remove(main_photo_path)
        
        # Mettre à jour la base de données
        with conn.cursor() as cursor:
            # Historique
            current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cursor.execute(
                "INSERT INTO Historique_Personne (date_modif, champ_modifie) VALUES (%s, %s)",
                (current_date, f"Suppression photo principale personne {person_id}")
            )
            new_hist_id = cursor.lastrowid
            
            # Update personne
            cursor.execute(
                "UPDATE Personne SET photo_url = NULL, id_hist_pers = %s WHERE id_personne = %s",
                (new_hist_id, person_id)
            )
            conn.commit()
        
        return ImageOperationResponse(
            message="Photo principale supprimée avec succès",
            person_id=person_id,
            image_name=file_name,
            image_path=main_photo_path
        )
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la suppression de la photo principale: {str(e)}"
        )

@router.get("/api/personnes/{person_id}/image/{image_name}")
async def get_person_image(person_id: int, image_name: str, conn = Depends(get_db)):
    """Récupère une image spécifique (principale ou supplémentaire)"""
    person_dir = get_person_dir(person_id, conn)  # Cette fonction inclut déjà le sous-dossier
    
    # Le reste du code reste inchangé
    if image_name.startswith("img_"):
        image_path = os.path.join(person_dir, IMAGES_SUBDIR, image_name)
    else:
        image_path = os.path.join(person_dir, image_name)
    
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image {image_name} non trouvée pour la personne {person_id}"
        )
    
    return FileResponse(image_path)




# NOUVELLES ROUTES POUR LE DOSSIER INCONNU

@router.post("/api/images/inconnu/", 
             response_model=ImageOperationResponse,
             status_code=status.HTTP_201_CREATED)
async def upload_unknown_image(
    file: UploadFile = File(...)
):
    """Ajoute une image dans le dossier inconnu"""
    unknown_dir = get_unknown_dir()
    
    # Générer un nom de fichier unique
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    new_filename = f"unknown_{timestamp}{file_ext}"
    file_path = os.path.join(unknown_dir, new_filename)
    
    # Sauvegarder le fichier
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement de l'image: {str(e)}"
        )
    
    return ImageOperationResponse(
        message="Image ajoutée au dossier inconnu avec succès",
        person_id=0,  # 0 car pas associé à une personne
        image_name=new_filename,
        image_path=file_path
    )

@router.get("/api/images/inconnu/", 
            response_model=UnknownImagesResponse)
def get_unknown_images():
    """Récupère toutes les images du dossier inconnu"""
    unknown_dir = get_unknown_dir()
    
    # Lister les images
    images = []
    if os.path.exists(unknown_dir):
        for file in os.listdir(unknown_dir):
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                images.append(file)
    
    return UnknownImagesResponse(
        images=images,
        images_dir=unknown_dir
    )

@router.get("/api/images/inconnu/{image_name}")
async def get_unknown_image(image_name: str):
    """Récupère une image spécifique du dossier inconnu"""
    unknown_dir = get_unknown_dir()
    image_path = os.path.join(unknown_dir, image_name)
    
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image {image_name} non trouvée dans le dossier inconnu"
        )
    
    return FileResponse(image_path)

@router.delete("/api/images/inconnu/{image_name}", 
               response_model=ImageOperationResponse)
def delete_unknown_image(image_name: str):
    """Supprime une image du dossier inconnu"""
    unknown_dir = get_unknown_dir()
    file_path = os.path.join(unknown_dir, image_name)
    
    # Vérifier si le fichier existe
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image {image_name} non trouvée dans le dossier inconnu"
        )
    
    try:
        os.remove(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la suppression de l'image: {str(e)}"
        )
    
    return ImageOperationResponse(
        message="Image supprimée avec succès du dossier inconnu",
        person_id=0,  # 0 car pas associé à une personne
        image_name=image_name,
        image_path=file_path
    )

@router.post("/api/images/inconnu/{image_name}/move/{person_id}", 
             response_model=ImageMoveResponse)
def move_unknown_image_to_person(
    image_name: str,
    person_id: int,
    as_main_photo: bool = Query(False, description="Définir comme photo principale"),
    conn = Depends(get_db)
):
    """Déplace une image du dossier inconnu vers le dossier d'une personne"""
    unknown_dir = get_unknown_dir()
    source_path = os.path.join(unknown_dir, image_name)
    
    if not os.path.exists(source_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image {image_name} non trouvée dans le dossier inconnu"
        )
    
    # get_person_dir inclut maintenant le sous-dossier personnes_images
    person_dir = get_person_dir(person_id, conn)
    
    try:
        if as_main_photo:
            # Traitement en tant que photo principale
            file_ext = os.path.splitext(image_name)[1]
            new_filename = f"photo_principale_{person_id}{file_ext}"
            destination_path = os.path.join(person_dir, new_filename)
            
            # Copier d'abord, puis mettre à jour la base de données
            shutil.copy2(source_path, destination_path)
            
            # Mise à jour de la base de données
            with conn.cursor() as cursor:
                # Historique
                current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute(
                    "INSERT INTO Historique_Personne (date_modif, champ_modifie) VALUES (%s, %s)",
                    (current_date, f"Ajout photo principale personne {person_id}")
                )
                new_hist_id = cursor.lastrowid
                
                # Update personne
                cursor.execute(
                    "UPDATE Personne SET photo_url = %s, id_hist_pers = %s WHERE id_personne = %s",
                    (new_filename, new_hist_id, person_id)
                )
                conn.commit()
                
            # Si tout s'est bien passé, supprimer l'original
            os.remove(source_path)
            
            return ImageMoveResponse(
                message="Image déplacée et définie comme photo principale",
                source_path=source_path,
                destination_path=destination_path,
                person_id=person_id
            )
        else:
            # Traitement en tant qu'image supplémentaire
            images_dir = get_images_dir(person_dir)
            
            # Générer un nom de fichier unique
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_ext = os.path.splitext(image_name)[1]
            new_filename = f"img_{timestamp}{file_ext}"
            destination_path = os.path.join(images_dir, new_filename)
            
            # Déplacer le fichier
            shutil.move(source_path, destination_path)
            
            return ImageMoveResponse(
                message="Image déplacée vers les images supplémentaires",
                source_path=source_path,
                destination_path=destination_path,
                person_id=person_id
            )
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors du déplacement de l'image: {str(e)}"
        )


@router.post("/api/personnes/{person_id}/images/{image_name}/recover", 
             response_model=ImageOperationResponse)
async def recover_image_to_unknown(
    person_id: int,
    image_name: str,
    conn = Depends(get_db)
):
    """Récupère une image du dossier d'une personne pour la remettre dans le dossier 'inconnu'"""
    
    person_dir = get_person_dir(person_id, conn)
    unknown_dir = get_unknown_dir()
    
    # Vérifier si l'image est une photo principale ou une image supplémentaire
    is_main_photo = image_name.startswith("photo_principale_")
    
    if is_main_photo:
        # C'est une photo principale
        source_path = os.path.join(person_dir, image_name)
    else:
        # C'est une image supplémentaire
        images_dir = get_images_dir(person_dir)
        source_path = os.path.join(images_dir, image_name)
    
    # Vérifier si le fichier existe
    if not os.path.exists(source_path):
        raise HTTPException(
            status_code=404,
            detail=f"Image {image_name} non trouvée pour la personne {person_id}"
        )
    
    try:
        # Générer un nom de fichier unique pour le dossier inconnu
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_ext = os.path.splitext(image_name)[1] or ".jpg"
        new_filename = f"recovered_{timestamp}{file_ext}"
        destination_path = os.path.join(unknown_dir, new_filename)
        
        # Déplacer le fichier vers le dossier inconnu
        shutil.copy2(source_path, destination_path)
        
        # Si c'était une photo principale, réinitialiser cette information dans la base de données
        if is_main_photo:
            with conn.cursor() as cursor:
                # Historique
                current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute(
                    "INSERT INTO Historique_Personne (date_modif, champ_modifie) VALUES (%s, %s)",
                    (current_date, f"Suppression photo principale personne {person_id}")
                )
                new_hist_id = cursor.lastrowid
                
                # Mettre à jour la personne (réinitialiser le champ photo_url)
                cursor.execute(
                    "UPDATE Personne SET photo_url = NULL, id_hist_pers = %s WHERE id_personne = %s",
                    (new_hist_id, person_id)
                )
                conn.commit()
        
        # Supprimer le fichier source
        os.remove(source_path)
        
        return ImageOperationResponse(
            message="Image récupérée avec succès dans le dossier inconnu",
            person_id=person_id,
            image_name=new_filename,
            image_path=destination_path
        )
    
    except Exception as e:
        # En cas d'erreur, annuler les modifications de la base de données
        if is_main_photo:
            conn.rollback()
        
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la récupération de l'image: {str(e)}"
        )