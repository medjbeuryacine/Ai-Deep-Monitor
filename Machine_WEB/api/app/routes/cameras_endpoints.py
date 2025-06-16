from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from datetime import datetime, time, date
import pymysql
from typing import List, Optional
from pydantic import BaseModel, Field, validator
from typing import Optional

######################################################### PYDANTIC #####################################################
class CameraData(BaseModel):
    IP: str
    login: str
    mdp: str
    nom_cam: str
    emplacement: str
    adresse_MAC: str
    adresse_flux_principal: Optional[str] = None
    adresse_flux_secondaire: Optional[str] = None
    adresse_flux_tertiaire: Optional[str] = None
    port_video: int = Field(554, ge=1, le=65535)
    is_active: bool = True
    flux_principal_active: bool = True
    flux_secondaire_active: bool = False
    flux_tertiaire_active: bool = False

class CharacteristicsData(BaseModel):
    marque: str
    modele: str
    mode_vision: str
    image_par_sec: int
    codec_video: str

class CameraPayload(BaseModel):
    camera: CameraData
    characteristics: CharacteristicsData

class CameraResponse(BaseModel):
    id_cam: int
    id_hist_cam: int
    id_caracteristique: int
    IP: str
    login: str
    mdp: str
    nom_cam: str
    emplacement: str
    adresse_MAC: str
    adresse_flux_principal: Optional[str]
    adresse_flux_secondaire: Optional[str]
    adresse_flux_tertiaire: Optional[str]
    port_video: int
    is_active: bool
    marque: str
    modele: str
    mode_vision: str
    image_par_sec: int
    codec_video: str
    flux_principal_active: bool
    flux_secondaire_active: bool
    flux_tertiaire_active: bool

    class Config:
        orm_mode = True

######################################################### API CAMERAS #####################################################

router = APIRouter(tags=["Cameras"])

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
    except pymysql.MySQLError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection error: {e}"
        )

def get_db():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/api/cameras/", response_model=List[CameraResponse])
def get_all_cameras(conn = Depends(get_db)):
    try:
        with conn.cursor() as cursor:
            query = """
            SELECT 
                c.id_cam, c.IP, c.login, c.mdp, c.nom_cam, c.emplacement,
                c.adresse_MAC, c.adresse_flux_principal, c.adresse_flux_secondaire, 
                c.adresse_flux_tertiaire, c.port_video, c.is_active,
                c.flux_principal_active, c.flux_secondaire_active, c.flux_tertiaire_active,
                c.id_hist_cam, c.id_caracteristique,
                cc.marque, cc.modele, cc.mode_vision, cc.image_par_sec, cc.codec_video
            FROM Camera c
            JOIN Caracteristique_Camera cc ON c.id_caracteristique = cc.id_caracteristique
            """
            cursor.execute(query)
            cameras = cursor.fetchall()
            return [CameraResponse(**camera) for camera in cameras]
            
    except pymysql.MySQLError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.post("/api/cameras/", response_model=CameraResponse)
def create_camera(payload: CameraPayload, conn = Depends(get_db)):
    try:
        with conn.cursor() as cursor:
            # Insert characteristics
            cursor.execute(
                """INSERT INTO Caracteristique_Camera 
                (marque, modele, mode_vision, image_par_sec, codec_video) 
                VALUES (%s, %s, %s, %s, %s)""",
                (
                    payload.characteristics.marque,
                    payload.characteristics.modele,
                    payload.characteristics.mode_vision,
                    payload.characteristics.image_par_sec,
                    payload.characteristics.codec_video
                )
            )
            id_caracteristique = cursor.lastrowid

            # Insert history
            current_date = datetime.now().date()
            cursor.execute(
                "INSERT INTO Historique_Cam (date_modif, champ_modifie) VALUES (%s, %s)",
                (current_date, "Camera Creation")
            )
            id_hist_cam = cursor.lastrowid

            # Insert camera
            cursor.execute(
                """INSERT INTO Camera 
                (IP, login, mdp, nom_cam, emplacement, adresse_MAC, 
                 adresse_flux_principal, adresse_flux_secondaire, adresse_flux_tertiaire,
                 port_video, is_active, flux_principal_active, flux_secondaire_active, flux_tertiaire_active,
                 id_hist_cam, id_caracteristique)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    payload.camera.IP,
                    payload.camera.login,
                    payload.camera.mdp,
                    payload.camera.nom_cam,
                    payload.camera.emplacement,
                    payload.camera.adresse_MAC,
                    payload.camera.adresse_flux_principal,
                    payload.camera.adresse_flux_secondaire,
                    payload.camera.adresse_flux_tertiaire,
                    payload.camera.port_video,
                    payload.camera.is_active,
                    payload.camera.flux_principal_active,
                    payload.camera.flux_secondaire_active,
                    payload.camera.flux_tertiaire_active,
                    id_hist_cam,
                    id_caracteristique
                )
            )
            camera_id = cursor.lastrowid
            
            # Fetch response
            cursor.execute(
                """SELECT 
                    c.id_cam, c.id_hist_cam, c.id_caracteristique,
                    c.IP, c.login, c.mdp, c.nom_cam, c.emplacement, 
                    c.adresse_MAC, c.adresse_flux_principal, c.adresse_flux_secondaire,
                    c.adresse_flux_tertiaire, c.port_video, c.is_active,
                    c.flux_principal_active, c.flux_secondaire_active, c.flux_tertiaire_active,
                    cc.marque, cc.modele, cc.mode_vision, cc.image_par_sec, cc.codec_video
                FROM Camera c
                JOIN Caracteristique_Camera cc ON c.id_caracteristique = cc.id_caracteristique
                WHERE c.id_cam = %s""", 
                (camera_id,)
            )
            new_camera = cursor.fetchone()
            
            conn.commit()
            return CameraResponse(**new_camera)
            
    except pymysql.MySQLError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.put("/api/cameras/{camera_id}", response_model=CameraResponse)
def update_camera(camera_id: int, payload: CameraPayload, conn = Depends(get_db)):
    try:
        with conn.cursor() as cursor:
            # Check if camera exists
            cursor.execute("SELECT id_caracteristique FROM Camera WHERE id_cam = %s", (camera_id,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Camera not found")

            current_id_caracteristique = result['id_caracteristique']

            # Update characteristics
            cursor.execute(
                """UPDATE Caracteristique_Camera 
                SET marque=%s, modele=%s, mode_vision=%s, image_par_sec=%s, codec_video=%s
                WHERE id_caracteristique = %s""",
                (
                    payload.characteristics.marque, 
                    payload.characteristics.modele, 
                    payload.characteristics.mode_vision, 
                    payload.characteristics.image_par_sec,
                    payload.characteristics.codec_video,
                    current_id_caracteristique
                )
            )

            # Insert history
            current_date = datetime.now().date()
            cursor.execute(
                "INSERT INTO Historique_Cam (date_modif, champ_modifie) VALUES (%s, %s)",
                (current_date, f"Modification of camera {camera_id}")
            )
            id_hist_cam = cursor.lastrowid

            # Update camera
            cursor.execute(
                """UPDATE Camera 
                SET IP=%s, login=%s, mdp=%s, nom_cam=%s, emplacement=%s, 
                adresse_MAC=%s, adresse_flux_principal=%s, adresse_flux_secondaire=%s,
                adresse_flux_tertiaire=%s, port_video=%s, is_active=%s, 
                flux_principal_active=%s, flux_secondaire_active=%s, flux_tertiaire_active=%s, id_hist_cam=%s
                WHERE id_cam=%s""",
                (
                    payload.camera.IP, 
                    payload.camera.login, 
                    payload.camera.mdp, 
                    payload.camera.nom_cam, 
                    payload.camera.emplacement, 
                    payload.camera.adresse_MAC, 
                    payload.camera.adresse_flux_principal,
                    payload.camera.adresse_flux_secondaire,
                    payload.camera.adresse_flux_tertiaire,
                    payload.camera.port_video,
                    payload.camera.is_active,
                    payload.camera.flux_principal_active,
                    payload.camera.flux_secondaire_active,
                    payload.camera.flux_tertiaire_active,
                    id_hist_cam, 
                    camera_id
                )
            )
            
            # Fetch updated data
            cursor.execute(
                """SELECT 
                    c.id_cam, c.id_hist_cam, c.id_caracteristique,
                    c.IP, c.login, c.mdp, c.nom_cam, c.emplacement, 
                    c.adresse_MAC, c.adresse_flux_principal, c.adresse_flux_secondaire,
                    c.adresse_flux_tertiaire, c.port_video, c.is_active,
                    c.flux_principal_active, c.flux_secondaire_active, c.flux_tertiaire_active,
                    cc.marque, cc.modele, cc.mode_vision, cc.image_par_sec, cc.codec_video
                FROM Camera c
                JOIN Caracteristique_Camera cc ON c.id_caracteristique = cc.id_caracteristique
                WHERE c.id_cam = %s""", 
                (camera_id,)
            )
            updated_camera = cursor.fetchone()
            
            conn.commit()
            return CameraResponse(**updated_camera)
        
    except pymysql.MySQLError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"MySQL error: {e}")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.delete("/api/cameras/{camera_id}", response_model=dict)
def delete_camera(camera_id: int, conn = Depends(get_db)):
    try:
        with conn.cursor() as cursor:
            # First, check if camera exists and get characteristics ID
            cursor.execute("SELECT id_caracteristique FROM Camera WHERE id_cam = %s", (camera_id,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Camera not found")

            id_caracteristique = result['id_caracteristique']

            # Delete the camera
            cursor.execute("DELETE FROM Camera WHERE id_cam = %s", (camera_id,))
            
            # Delete associated characteristics
            cursor.execute(
                "DELETE FROM Caracteristique_Camera WHERE id_caracteristique = %s", 
                (id_caracteristique,)
            )
            
            conn.commit()
            return {"message": "Camera deleted successfully"}
        
    except pymysql.MySQLError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database error: {e}")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")