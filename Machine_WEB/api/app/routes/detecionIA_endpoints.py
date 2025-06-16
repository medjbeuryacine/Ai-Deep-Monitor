from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import pymysql  
from pydantic import BaseModel
from datetime import date

###################################################### PYDANTIC #################################################################

class ModelConfig(BaseModel):
    id_cam: int
    id_modele_visage: Optional[int] = None
    id_modele_personne: Optional[int] = None
    id_modele_anomalie: Optional[int] = None
    seuil_visage: Optional[float] = 0.7
    seuil_personne: Optional[float] = 0.6
    seuil_anomalie: Optional[float] = 0.5
    is_active: bool = True

class ModelConfigUpdate(BaseModel):
    id_modele_visage: Optional[int] = None
    id_modele_personne: Optional[int] = None
    id_modele_anomalie: Optional[int] = None
    seuil_visage: Optional[float] = None
    seuil_personne: Optional[float] = None
    seuil_anomalie: Optional[float] = None
    is_active: Optional[bool] = None

class AIModel(BaseModel):
    nom: str
    type: str
    version: str
    chemin_modele: str
    date_entrainement: date
    precision: Optional[float] = None
    seuil_confiance: Optional[float] = 0.7
    is_active: bool = True

class DetectionStats(BaseModel):
    person_detections: int
    anomaly_detections: int
    face_detections: int
    recent_detections: List[dict]

######################################################## API ROUTE ###############################################################

router = APIRouter(tags=["Detection IA"])  # Fixed typo in tag name

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

@router.get("/api/configs/", response_model=List[dict])
async def get_all_configs(conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT c.id_config, c.id_cam, c.is_active, 
                   mv.nom as modele_visage, mp.nom as modele_personne, ma.nom as modele_anomalie,
                   c.seuil_visage, c.seuil_personne, c.seuil_anomalie
            FROM Configuration_IA c
            LEFT JOIN Modele_IA mv ON c.id_modele_visage = mv.id_modele
            LEFT JOIN Modele_IA mp ON c.id_modele_personne = mp.id_modele
            LEFT JOIN Modele_IA ma ON c.id_modele_anomalie = ma.id_modele
        """)
        configs = cursor.fetchall()
        return configs  # PyMySQL already returns dictionaries with DictCursor
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des configs: {str(e)}")

@router.get("/api/configs/{config_id}", response_model=dict)
async def get_config(config_id: int, conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT c.id_config, c.id_cam, c.is_active, 
                   mv.nom as modele_visage, mp.nom as modele_personne, ma.nom as modele_anomalie,
                   c.seuil_visage, c.seuil_personne, c.seuil_anomalie
            FROM Configuration_IA c
            LEFT JOIN Modele_IA mv ON c.id_modele_visage = mv.id_modele
            LEFT JOIN Modele_IA mp ON c.id_modele_personne = mp.id_modele
            LEFT JOIN Modele_IA ma ON c.id_modele_anomalie = ma.id_modele
            WHERE c.id_config = %s
        """, (config_id,))  # Changed ? to %s for PyMySQL
        config = cursor.fetchone()
        
        if config is None:
            raise HTTPException(status_code=404, detail="Configuration non trouvée")
            
        return config  # PyMySQL already returns dictionaries with DictCursor
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")
    
@router.post("/api/configs/", response_model=dict)
async def create_config(config: ModelConfig, conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO Configuration_IA (
                id_cam, id_modele_visage, id_modele_personne, id_modele_anomalie,
                seuil_visage, seuil_personne, seuil_anomalie, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (  # Changed ? to %s for PyMySQL
            config.id_cam, config.id_modele_visage, config.id_modele_personne, config.id_modele_anomalie,
            config.seuil_visage, config.seuil_personne, config.seuil_anomalie, config.is_active
        ))
        conn.commit()
        
        # Convert to dict and then add the id field
        config_dict = config.dict()
        config_dict["id_config"] = cursor.lastrowid
        
        return config_dict
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/api/models/{model_id}")
async def update_model(model_id: int, model_update: dict, conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        # Vérifier que le modèle existe
        cursor.execute("SELECT id_modele FROM Modele_IA WHERE id_modele = %s", (model_id,))  # Changed ? to %s for PyMySQL
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Modèle non trouvé")
        
        # Construire la requête de mise à jour
        update_fields = []
        params = []
        
        if 'is_active' in model_update:
            update_fields.append("is_active = %s")  # Changed ? to %s for PyMySQL
            params.append(model_update['is_active'])
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="Aucun champ valide à mettre à jour")
        
        query = f"UPDATE Modele_IA SET {', '.join(update_fields)} WHERE id_modele = %s"  # Changed ? to %s for PyMySQL
        params.append(model_id)
        
        cursor.execute(query, params)
        conn.commit()
        
        return {"message": "Modèle mis à jour avec succès"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Erreur lors de la mise à jour: {str(e)}")

@router.delete("/api/configs/{config_id}")
async def delete_config(config_id: int, conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM Configuration_IA WHERE id_config = %s", (config_id,))  # Changed ? to %s for PyMySQL
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Configuration not found")
            
        return {"message": "Configuration deleted successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Routes pour les modèles IA
@router.get("/api/models/", response_model=List[dict])
async def get_all_models(conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM Modele_IA")
        models = cursor.fetchall()
        return models  # PyMySQL already returns dictionaries with DictCursor
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des modèles: {str(e)}")

@router.post("/api/models/", response_model=dict)
async def create_model(model: AIModel, conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO Modele_IA (
                nom, type, version, chemin_modele, date_entrainement, 
                precision, seuil_confiance, is_active
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (  # Changed ? to %s for PyMySQL
            model.nom, model.type, model.version, model.chemin_modele, 
            model.date_entrainement, model.precision, model.seuil_confiance, model.is_active
        ))
        conn.commit()
        
        # Convert to dict and then add the id field
        model_dict = model.dict()
        model_dict["id_modele"] = cursor.lastrowid
        
        return model_dict
    except pymysql.IntegrityError:  # Changed sqlite3 to pymysql
        conn.rollback()
        raise HTTPException(status_code=400, detail="Model name already exists")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Routes pour les statistiques
@router.get("/api/stats/", response_model=DetectionStats)
async def get_detection_stats(conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        # Nombre de détections de personnes
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM Detection 
            WHERE type_detection = 'Personne'
        """)
        person_detections = cursor.fetchone()['count']
        
        # Nombre de détections d'anomalies
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM Detection 
            WHERE type_detection = 'Anomalie'
        """)
        anomaly_detections = cursor.fetchone()['count']
        
        # Nombre de détections de visages
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM Detection 
            WHERE type_detection = 'Visage'
        """)
        face_detections = cursor.fetchone()['count']
        
        # Détections récentes (7 derniers jours)
        cursor.execute("""
            SELECT d.id_detection, d.timestamp, d.type_detection, d.confiance,
                   m.nom as model_name, c.nom_cam as camera_name
            FROM Detection d
            JOIN Modele_IA m ON d.id_modele = m.id_modele
            JOIN Camera_Detection cd ON d.id_detection = cd.id_detection
            JOIN Camera c ON cd.id_cam = c.id_cam
            WHERE d.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY d.timestamp DESC
            LIMIT 10
        """)  # Changed SQLite datetime() to MySQL DATE_SUB()
        recent_detections = cursor.fetchall()  # PyMySQL already returns dictionaries with DictCursor
        
        return {
            "person_detections": person_detections,
            "anomaly_detections": anomaly_detections,
            "face_detections": face_detections,
            "recent_detections": recent_detections
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/detections/recent")
async def get_recent_detections(limit: int = 10, conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT d.id_detection, d.timestamp, d.type_detection, d.confiance,
                   m.nom as model_name, c.nom_cam as camera_name
            FROM Detection d
            JOIN Modele_IA m ON d.id_modele = m.id_modele
            JOIN Camera_Detection cd ON d.id_detection = cd.id_detection
            JOIN Camera c ON cd.id_cam = c.id_cam
            ORDER BY d.timestamp DESC
            LIMIT %s
        """, (limit,))  # Changed ? to %s for PyMySQL
        
        detections = cursor.fetchall()  # PyMySQL already returns dictionaries with DictCursor
        return detections
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/models/active")
async def get_active_models(conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id_modele, nom, type, version 
            FROM Modele_IA 
            WHERE is_active = 1
        """)
        models = cursor.fetchall()  # PyMySQL already returns dictionaries with DictCursor
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/models/{model_id}/stats")
async def get_model_stats(model_id: int, conn = Depends(get_db)):  # Removed incorrect sqlite3.Connection type hint
    cursor = conn.cursor()
    
    try:
        # Statistiques générales
        cursor.execute("""
            SELECT 
                COUNT(*) as total_detections,
                AVG(confiance) as avg_confidence,
                MIN(confiance) as min_confidence,
                MAX(confiance) as max_confidence
            FROM Detection
            WHERE id_modele = %s
        """, (model_id,))  # Changed ? to %s for PyMySQL
        stats = cursor.fetchone()  # PyMySQL already returns dictionaries with DictCursor
        
        # Détections par type
        cursor.execute("""
            SELECT 
                type_detection,
                COUNT(*) as count,
                AVG(confiance) as avg_confidence
            FROM Detection
            WHERE id_modele = %s
            GROUP BY type_detection
        """, (model_id,))  # Changed ? to %s for PyMySQL
        stats['by_type'] = cursor.fetchall()  # PyMySQL already returns dictionaries with DictCursor
        
        # Performance temporelle
        cursor.execute("""
            SELECT 
                DATE(timestamp) as date,
                COUNT(*) as count,
                AVG(confiance) as avg_confidence
            FROM Detection
            WHERE id_modele = %s
            GROUP BY DATE(timestamp)
            ORDER BY date DESC
            LIMIT 7
        """, (model_id,))  # Changed ? to %s for PyMySQL
        stats['by_date'] = cursor.fetchall()  # PyMySQL already returns dictionaries with DictCursor
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))