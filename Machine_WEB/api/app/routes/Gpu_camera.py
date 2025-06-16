from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pymysql

router = APIRouter(tags=["GPU Management"])

# Modèles Pydantic
class GPUBase(BaseModel):
    name: str
    status: str = "actif"
    ip_address: Optional[str] = None
    login: Optional[str] = None
    password: Optional[str] = None

class GPUCreate(GPUBase):
    pass

class GPU(GPUBase):
    id_gpu: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class CameraAssociation(BaseModel):
    id_camera: int

class GPUWithCameras(GPU):
    cameras: List[int] = []

# Fonction utilitaire pour la connexion DB
def get_db_connection():
    return pymysql.connect(
        host="mysql",
        user="user",
        password="password",
        database="Configuration",
        cursorclass=pymysql.cursors.DictCursor,
        port=3306
    )

# Endpoints
@router.post("/api/gpu-groups/", response_model=GPU, status_code=status.HTTP_201_CREATED)
def create_gpu_group(gpu: GPUCreate):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            sql = """
            INSERT INTO GPU_Processors 
            (name, status, ip_address, login, password) 
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                gpu.name, 
                gpu.status, 
                gpu.ip_address, 
                gpu.login, 
                gpu.password
            ))
            gpu_id = cursor.lastrowid
            connection.commit()
            
            # Récupérer le groupe créé
            cursor.execute("SELECT * FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            new_gpu = cursor.fetchone()
            return GPU(**new_gpu)
    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()

@router.get("/api/gpu-groups/", response_model=List[GPUWithCameras])
def get_all_gpu_groups():
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Récupérer tous les groupes GPU
            cursor.execute("SELECT * FROM GPU_Processors")
            gpu_groups = cursor.fetchall()
            
            # Pour chaque groupe, récupérer les caméras associées
            result = []
            for group in gpu_groups:
                cursor.execute(
                    "SELECT id_camera FROM GPU_Camera_Associations WHERE id_gpu = %s",
                    (group['id_gpu'],)
                )
                cameras = [assoc['id_camera'] for assoc in cursor.fetchall()]
                result.append(GPUWithCameras(**group, cameras=cameras))
            
            return result
    except pymysql.MySQLError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()

@router.get("/api/gpu-groups/{gpu_id}", response_model=GPUWithCameras)
def get_gpu_group(gpu_id: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Récupérer le groupe GPU
            cursor.execute("SELECT * FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            gpu_group = cursor.fetchone()
            if not gpu_group:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="GPU group not found"
                )
            
            # Récupérer les caméras associées
            cursor.execute(
                "SELECT id_camera FROM GPU_Camera_Associations WHERE id_gpu = %s",
                (gpu_id,)
            )
            cameras = [assoc['id_camera'] for assoc in cursor.fetchall()]
            
            return GPUWithCameras(**gpu_group, cameras=cameras)
    except pymysql.MySQLError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()

@router.put("/api/gpu-groups/{gpu_id}", response_model=GPU)
def update_gpu_group(gpu_id: int, gpu: GPUBase):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si le groupe existe
            cursor.execute("SELECT 1 FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="GPU group not found"
                )
            
            # Mettre à jour le groupe
            sql = """
            UPDATE GPU_Processors 
            SET name = %s, status = %s, ip_address = %s, login = %s, password = %s 
            WHERE id_gpu = %s
            """
            cursor.execute(sql, (
                gpu.name, 
                gpu.status, 
                gpu.ip_address, 
                gpu.login, 
                gpu.password,
                gpu_id
            ))
            connection.commit()
            
            # Récupérer le groupe mis à jour
            cursor.execute("SELECT * FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            updated_gpu = cursor.fetchone()
            return GPU(**updated_gpu)
    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()

@router.delete("/api/gpu-groups/{gpu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gpu_group(gpu_id: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si le groupe existe
            cursor.execute("SELECT 1 FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="GPU group not found"
                )
            
            # Supprimer le groupe (les associations seront supprimées en cascade)
            cursor.execute("DELETE FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            connection.commit()
    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()

@router.post("/api/gpu-groups/{gpu_id}/cameras", status_code=status.HTTP_201_CREATED)
def add_camera_to_gpu(gpu_id: int, camera: CameraAssociation):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si le groupe existe
            cursor.execute("SELECT 1 FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="GPU group not found"
                )
            
            # Vérifier si la caméra existe
            cursor.execute("SELECT 1 FROM Camera WHERE id_cam = %s", (camera.id_camera,))
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Camera not found"
                )
            
            # Vérifier si l'association existe déjà
            cursor.execute(
                "SELECT 1 FROM GPU_Camera_Associations WHERE id_gpu = %s AND id_camera = %s",
                (gpu_id, camera.id_camera)
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Camera already assigned to this GPU group"
                )
            
            # Créer l'association
            cursor.execute(
                "INSERT INTO GPU_Camera_Associations (id_gpu, id_camera) VALUES (%s, %s)",
                (gpu_id, camera.id_camera)
            )
            connection.commit()
    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()

@router.delete("/api/gpu-groups/{gpu_id}/cameras/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_camera_from_gpu(gpu_id: int, camera_id: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si l'association existe
            cursor.execute(
                "SELECT 1 FROM GPU_Camera_Associations WHERE id_gpu = %s AND id_camera = %s",
                (gpu_id, camera_id)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Camera not assigned to this GPU group"
                )
            
            # Supprimer l'association
            cursor.execute(
                "DELETE FROM GPU_Camera_Associations WHERE id_gpu = %s AND id_camera = %s",
                (gpu_id, camera_id)
            )
            connection.commit()
    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()

@router.put("/api/gpu-groups/{gpu_id}/status", response_model=GPU)
def toggle_gpu_status(gpu_id: int):
    connection = get_db_connection()
    try:
        with connection.cursor() as cursor:
            # Vérifier si le groupe existe
            cursor.execute("SELECT status FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            result = cursor.fetchone()
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="GPU group not found"
                )
            
            # Basculer le statut
            new_status = "inactif" if result["status"] == "actif" else "actif"
            cursor.execute(
                "UPDATE GPU_Processors SET status = %s WHERE id_gpu = %s",
                (new_status, gpu_id)
            )
            connection.commit()
            
            # Récupérer le groupe mis à jour
            cursor.execute("SELECT * FROM GPU_Processors WHERE id_gpu = %s", (gpu_id,))
            updated_gpu = cursor.fetchone()
            return GPU(**updated_gpu)
    except pymysql.MySQLError as e:
        connection.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database error: {e}"
        )
    finally:
        connection.close()