# # api2_rtsp_to_hls.py
# import cv2
# import numpy as np
# import subprocess
# import threading
# import time
# import os
# import shutil
# from fastapi import FastAPI, Query, HTTPException
# from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
# from ultralytics import YOLO
# import asyncio
# import re
# import uuid
# import logging
# from fastapi.middleware.cors import CORSMiddleware

# # Configuration des logs
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# app = FastAPI(title="RTSP to HLS with AI Detection")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Modèles YOLO
# model_general = YOLO("yolov8n.pt")
# model_face = YOLO("yolov8n-face.pt")

# # Configuration
# ALLOWED_CLASSES = ["person", "phone"]
# HTTP_PORT = 8020
# RTSP_SERVER_IP = "192.168.1.153"
# HLS_OUTPUT_DIR = "tmp/hls_output"
# HLS_SEGMENT_TIME = 4
# HLS_LIST_SIZE = 10

# # Variables globales
# active_processes = {}  # {stream_id: {process, frame, lock, etc.}}
# processing_enabled = {}  # {stream_id: True/False}

# # Création des répertoires nécessaires
# os.makedirs(HLS_OUTPUT_DIR, exist_ok=True)
# for stream_id in ["youtube", "youtubelive", "detection"]:
#     os.makedirs(f"{HLS_OUTPUT_DIR}/{stream_id}", exist_ok=True)

# def cleanup_hls_output(stream_id):
#     """Nettoie le répertoire HLS de sortie pour un flux spécifique."""
#     output_dir = f"{HLS_OUTPUT_DIR}/{stream_id}"
#     if os.path.exists(output_dir):
#         for file in os.listdir(output_dir):
#             file_path = os.path.join(output_dir, file)
#             try:
#                 if os.path.isfile(file_path):
#                     os.unlink(file_path)
#             except Exception as e:
#                 logger.error(f"❌ Erreur suppression {file_path}: {str(e)}")

# def detect_objects(frame, detect_list):
#     """Applique les détections IA sur une frame."""
    
#     # Détection objets
#     if any(t in detect_list for t in ["person", "phone", "all"]):
#         results = model_general(frame, conf=0.4)[0]
#         for box in results.boxes:
#             cls_id = int(box.cls[0].item())
#             label = model_general.model.names[cls_id].lower()
#             conf = float(box.conf[0].item())

#             if ("all" in detect_list and label in ALLOWED_CLASSES) or (label in detect_list):
#                 x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
#                 cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
#                 cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10),
#                             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
#     # Détection visages
#     if "face" in detect_list or "all" in detect_list:
#         results = model_face(frame, conf=0.5)[0]
#         for box in results.boxes:
#             x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
#             cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
#             cv2.putText(frame, "Face", (x1, y1 - 10),
#                         cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 255), 2)
    
#     return frame

# def start_hls_process(stream_id, quality="hd"):
#     """Démarre le processus FFmpeg HLS pour un flux."""
#     # Nettoyer le répertoire HLS
#     cleanup_hls_output(stream_id)
    
#     # Préparer les dossiers
#     output_dir = f"{HLS_OUTPUT_DIR}/{stream_id}"
#     os.makedirs(output_dir, exist_ok=True)
    
#     # Paramètres de résolution
#     resolution = "1280x720" if quality == "hd" else "854x480"
    
#     cmd = [
#         'ffmpeg',
#         '-y',
#         '-f', 'rawvideo',
#         '-pix_fmt', 'bgr24',
#         '-s', resolution,
#         '-r', '25',
#         '-i', '-',
#         '-c:v', 'libx264',
#         '-preset', 'ultrafast',
#         '-tune', 'zerolatency',
#         '-f', 'hls',
#         '-hls_time', str(HLS_SEGMENT_TIME),
#         '-hls_list_size', str(HLS_LIST_SIZE),
#         '-hls_flags', 'delete_segments+append_list',
#         '-hls_segment_filename', f'{output_dir}/segment_%03d.ts',
#         f'{output_dir}/stream.m3u8'
#     ]
    
#     process = subprocess.Popen(
#         cmd,
#         stdin=subprocess.PIPE,
#         stdout=subprocess.PIPE,
#         stderr=subprocess.PIPE,
#         bufsize=10**8,
#         universal_newlines=False
#     )
    
#     logger.info(f"✅ Processus HLS démarré pour {stream_id}")
#     return process

# def process_rtsp_stream(stream_id, rtsp_url, detect_list=None, quality="hd"):
#     """Traite un flux RTSP pour la détection IA et la conversion HLS."""
#     if detect_list is None:
#         detect_list = ["all"]
    
#     # Créer un verrou
#     frame_lock = threading.Lock()
#     current_frame = None
    
#     # Démarrer le processus HLS
#     hls_process = start_hls_process(stream_id, quality)
    
#     # Stockage global
#     active_processes[stream_id] = {
#         'frame_lock': frame_lock,
#         'current_frame': current_frame,
#         'hls_process': hls_process,
#         'detect_list': detect_list,
#         'quality': quality,
#         'rtsp_url': rtsp_url,
#         'segments_generated': 0,
#         'last_segment_time': time.time()
#     }
    
#     # Activer le traitement
#     processing_enabled[stream_id] = True
    
#     def processing_thread():
#         nonlocal current_frame
        
#         retry_count = 0
#         max_retries = 5
        
#         while processing_enabled.get(stream_id, False):
#             try:
#                 # Ouvrir le flux RTSP
#                 cap = cv2.VideoCapture(rtsp_url)
#                 if not cap.isOpened():
#                     logger.error(f"❌ Impossible d'ouvrir le flux RTSP: {rtsp_url}")
#                     retry_count += 1
                    
#                     if retry_count >= max_retries:
#                         logger.error(f"❌ Abandon après {max_retries} tentatives: {stream_id}")
#                         processing_enabled[stream_id] = False
#                         break
                        
#                     time.sleep(2)
#                     continue
                
#                 logger.info(f"✅ Flux RTSP ouvert: {rtsp_url}")
#                 retry_count = 0  # Réinitialiser le compteur de tentatives
#                 frame_count = 0
                
#                 # Paramètres de résolution
#                 target_width = 1280 if quality == "hd" else 854
#                 target_height = 720 if quality == "hd" else 480
                
#                 while processing_enabled.get(stream_id, False):
#                     ret, frame = cap.read()
#                     if not ret:
#                         logger.warning(f"⚠️ Erreur lecture frame: {stream_id}")
#                         break
                    
#                     frame_count += 1
                    
#                     # Appliquer la détection IA
#                     processed_frame = detect_objects(frame, detect_list)
                    
#                     # Redimensionner si nécessaire
#                     height, width = processed_frame.shape[:2]
#                     if width != target_width or height != target_height:
#                         processed_frame = cv2.resize(processed_frame, (target_width, target_height))
                    
#                     # Mettre à jour le frame pour la visualisation HTTP
#                     with frame_lock:
#                         current_frame = processed_frame.copy()
#                         active_processes[stream_id]['current_frame'] = current_frame
                    
#                     # Envoyer à FFmpeg pour HLS
#                     try:
#                         if stream_id in active_processes and active_processes[stream_id]['hls_process']:
#                             active_processes[stream_id]['hls_process'].stdin.write(processed_frame.tobytes())
#                             active_processes[stream_id]['hls_process'].stdin.flush()
#                     except BrokenPipeError:
#                         logger.error(f"⚠️ Pipe cassé, redémarrage HLS: {stream_id}")
#                         if stream_id in active_processes:
#                             # Redémarrer le processus HLS
#                             if active_processes[stream_id]['hls_process']:
#                                 try:
#                                     active_processes[stream_id]['hls_process'].terminate()
#                                 except:
#                                     pass
#                             active_processes[stream_id]['hls_process'] = start_hls_process(stream_id, quality)
#                         break
                    
#                     # Log périodique
#                     if frame_count % 100 == 0:
#                         logger.info(f"📊 {stream_id}: {frame_count} frames traitées")
                        
#                         # Mettre à jour le compteur de segments
#                         active_processes[stream_id]['segments_generated'] += 1
#                         active_processes[stream_id]['last_segment_time'] = time.time()
                
#                 cap.release()
                
#                 # Si le traitement est toujours actif, attendre avant de réessayer
#                 if processing_enabled.get(stream_id, False):
#                     time.sleep(2)
                
#             except Exception as e:
#                 logger.error(f"❌ Erreur traitement {stream_id}: {str(e)}")
#                 time.sleep(2)
        
#         # Nettoyage
#         if stream_id in active_processes:
#             if active_processes[stream_id]['hls_process']:
#                 try:
#                     active_processes[stream_id]['hls_process'].terminate()
#                 except:
#                     pass
#             del active_processes[stream_id]
        
#         logger.info(f"🛑 Traitement terminé: {stream_id}")
    
#     # Démarrer le thread de traitement
#     threading.Thread(target=processing_thread, daemon=True).start()
    
#     return {
#         'stream_id': stream_id,
#         'rtsp_url': rtsp_url,
#         'hls_url': f"http://{RTSP_SERVER_IP}:{HTTP_PORT}/hls/{stream_id}/stream.m3u8",
#         'mjpeg_url': f"http://{RTSP_SERVER_IP}:{HTTP_PORT}/stream/{stream_id}.mjpg",
#         'detect_list': detect_list,
#         'quality': quality
#     }

# def stop_rtsp_processing(stream_id):
#     """Arrête le traitement d'un flux RTSP."""
#     if stream_id not in processing_enabled:
#         return False, "Flux non trouvé"
    
#     processing_enabled[stream_id] = False
    
#     if stream_id in active_processes:
#         process = active_processes[stream_id].get('hls_process')
#         if process:
#             try:
#                 process.stdin.close()
#                 process.terminate()
#                 process.wait(timeout=5)
#             except:
#                 pass
    
#     logger.info(f"🛑 Traitement arrêté: {stream_id}")
#     return True, "Traitement arrêté"

# @app.get("/api/start")
# async def start_processing(
#     rtsp_url: str = Query(..., description="URL RTSP à traiter"),
#     stream_id: str = Query(..., description="Identifiant du flux de sortie"),
#     detect: str = Query("all", description="Objets à détecter (person,face,phone,all)"),
#     q: str = Query("hd", description="Qualité: hd ou low")
# ):
#     """Démarre le traitement d'un flux RTSP avec détection IA et conversion HLS."""
#     # Valider les paramètres
#     valid_targets = {"person", "face", "phone", "all"}
#     detect_list = [d.strip().lower() for d in detect.split(",") if d.strip().lower() in valid_targets]
#     if not detect_list:
#         detect_list = ["all"]
    
#     quality = q if q in ["hd", "low"] else "hd"
    
#     # Vérifier si le traitement est déjà en cours
#     if stream_id in processing_enabled and processing_enabled[stream_id]:
#         return JSONResponse({
#             "status": "Traitement déjà en cours",
#             "stream_id": stream_id,
#             "hls_url": f"http://{RTSP_SERVER_IP}:{HTTP_PORT}/hls/{stream_id}/stream.m3u8"
#         })
    
#     # Démarrer le traitement
#     result = process_rtsp_stream(stream_id, rtsp_url, detect_list, quality)
    
#     return JSONResponse({
#         "status": "Traitement démarré",
#         **result
#     })

# @app.get("/api/stop")
# async def stop_processing(
#     stream_id: str = Query(..., description="Identifiant du flux à arrêter")
# ):
#     """Arrête le traitement d'un flux."""
#     success, message = stop_rtsp_processing(stream_id)
    
#     if success:
#         return JSONResponse({
#             "status": "success",
#             "message": message
#         })
#     else:
#         raise HTTPException(
#             status_code=404,
#             detail=message
#         )

# @app.get("/api/status")
# async def get_status():
#     """Récupère l'état de tous les flux actifs."""
#     streams_status = {}
    
#     for stream_id, enabled in processing_enabled.items():
#         if enabled and stream_id in active_processes:
#             info = active_processes[stream_id]
#             streams_status[stream_id] = {
#                 "active": True,
#                 "rtsp_url": info.get('rtsp_url'),
#                 "segments_generated": info.get('segments_generated', 0),
#                 "last_segment_time": info.get('last_segment_time', 0),
#                 "hls_url": f"http://{RTSP_SERVER_IP}:{HTTP_PORT}/hls/{stream_id}/stream.m3u8",
#                 "mjpeg_url": f"http://{RTSP_SERVER_IP}:{HTTP_PORT}/stream/{stream_id}.mjpg",
#                 "detect_list": info.get('detect_list', []),
#                 "quality": info.get('quality', 'hd')
#             }
    
#     return JSONResponse({
#         "active_streams": streams_status,
#         "count": len(streams_status)
#     })

# @app.get("/api/status/{stream_id}")
# async def get_stream_status(stream_id: str):
#     """Récupère l'état d'un flux spécifique."""
#     if stream_id not in processing_enabled or not processing_enabled[stream_id]:
#         raise HTTPException(
#             status_code=404,
#             detail="Flux non trouvé ou inactif"
#         )
    
#     if stream_id not in active_processes:
#         raise HTTPException(
#             status_code=404,
#             detail="Informations de flux non disponibles"
#         )
    
#     info = active_processes[stream_id]
#     return JSONResponse({
#         "stream_id": stream_id,
#         "active": processing_enabled[stream_id],
#         "rtsp_url": info.get('rtsp_url'),
#         "segments_generated": info.get('segments_generated', 0),
#         "last_segment_time": info.get('last_segment_time', 0),
#         "hls_url": f"http://{RTSP_SERVER_IP}:{HTTP_PORT}/hls/{stream_id}/stream.m3u8",
#         "mjpeg_url": f"http://{RTSP_SERVER_IP}:{HTTP_PORT}/stream/{stream_id}.mjpg",
#         "detect_list": info.get('detect_list', []),
#         "quality": info.get('quality', 'hd')
#     })

# @app.get("/stream/{stream_id}.mjpg")
# async def video_feed(stream_id: str):
#     """Flux vidéo HTTP MJPEG pour un flux spécifique."""
#     if stream_id not in active_processes:
#         raise HTTPException(
#             status_code=404,
#             detail="Flux non trouvé"
#         )
    
#     async def generate():
#         while stream_id in active_processes and processing_enabled.get(stream_id, False):
#             with active_processes[stream_id]['frame_lock']:
#                 if active_processes[stream_id]['current_frame'] is None:
#                     await asyncio.sleep(0.1)
#                     continue
                
#                 _, buffer = cv2.imencode('.jpg', active_processes[stream_id]['current_frame'], [
#                     int(cv2.IMWRITE_JPEG_QUALITY), 70
#                 ])
#                 frame_data = buffer.tobytes()

#             yield (
#                 b"--frame\r\n"
#                 b"Content-Type: image/jpeg\r\n\r\n" + frame_data + b"\r\n"
#             )
#             await asyncio.sleep(0.03)

#     return StreamingResponse(
#         generate(),
#         media_type="multipart/x-mixed-replace; boundary=frame"
#     )

# @app.get("/hls/{stream_id}/{file_path:path}")
# async def serve_hls(stream_id: str, file_path: str):
#     """Sert les fichiers HLS pour un flux spécifique."""
#     file_location = f"{HLS_OUTPUT_DIR}/{stream_id}/{file_path}"
#     if not os.path.exists(file_location):
#         raise HTTPException(status_code=404)
    
#     return FileResponse(
#         file_location,
#         headers={
#             "Access-Control-Allow-Origin": "*",
#             "Cache-Control": "no-cache"
#         }
#     )

# @app.get("/")
# def accueil():
#     return {
#         "message": "API RTSP vers HLS avec détection IA",
#         "version": "1.0.0",
#         "endpoints": {
#             "start": "/api/start?rtsp_url=rtsp://...&stream_id=...",
#             "stop": "/api/stop?stream_id=...",
#             "status": "/api/status",
#             "stream": "/stream/{stream_id}.mjpg",
#             "hls": "/hls/{stream_id}/stream.m3u8"
#         }
#     }

# if __name__ == '__main__':
#     import uvicorn
    
#     # Nettoyer les répertoires de sortie au démarrage
#     for stream_id in ["youtube", "youtubelive", "detection"]:
#         cleanup_hls_output(stream_id)
    
#     uvicorn.run(app, host="0.0.0.0", port=HTTP_PORT)






####################`TEST`######################

# api_rtsp_to_hls.py

# import os
# import subprocess
# import threading
# import time
# import cv2
# import numpy as np
# import logging
# from pathlib import Path
# from fastapi import FastAPI, Query, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.staticfiles import StaticFiles
# from ultralytics import YOLO
# import shutil

# # Configuration du logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="RTSP to HLS Converter with AI Detection")

# # Configuration
# HLS_OUTPUT_DIR = "tmp/hls_output"
# HLS_ANALYTICS_DIR = f"{HLS_OUTPUT_DIR}/analytics"
# HTTP_PORT = 8020

# # S'assurer que les répertoires existent
# Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
# Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)

# # Charger les modèles YOLO une seule fois au démarrage
# try:
#     yolo_model = YOLO("yolov8n.pt")  # Modèle général pour la détection d'objets
#     face_model = YOLO("yolov8n-face.pt")  # Modèle spécifique pour la détection de visages
#     logger.info("Modèles YOLO chargés avec succès")
# except Exception as e:
#     logger.error(f"Erreur lors du chargement des modèles YOLO: {str(e)}")
#     yolo_model = None
#     face_model = None

# # Variables globales
# current_process = None
# ai_process = None
# process_lock = threading.Lock()
# restart_event = threading.Event()
# active_rtsp_url = None
# ai_enabled = True
# detection_results = {
#     "objects": {},
#     "faces": 0,
#     "last_update": None
# }

# def draw_boxes(frame, results, is_face=False):
#     """Dessine les boîtes de détection sur l'image"""
#     annotated_frame = frame.copy()
    
#     if results.boxes:
#         for box in results.boxes:
#             # Récupérer les coordonnées et la classe
#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             conf = float(box.conf[0])
            
#             if is_face:
#                 # Rouge pour les visages
#                 color = (0, 0, 255)
#                 label = f"Face: {conf:.2f}"
#             else:
#                 # Vert pour les objets
#                 color = (0, 255, 0)
#                 cls = int(box.cls[0])
#                 class_name = results.names[cls]
#                 label = f"{class_name}: {conf:.2f}"
            
#             # Dessiner la boîte
#             cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            
#             # Ajouter le texte
#             cv2.putText(
#                 annotated_frame, 
#                 label, 
#                 (x1, y1 - 10), 
#                 cv2.FONT_HERSHEY_SIMPLEX, 
#                 0.5, 
#                 color, 
#                 2
#             )
    
#     return annotated_frame

# def ai_detection_thread(rtsp_url):
#     """Thread qui effectue la détection d'objets et de visages"""
#     global detection_results
    
#     logger.info(f"Démarrage du thread de détection AI pour: {rtsp_url}")
    
#     try:
#         # Ouvrir le flux RTSP
#         cap = cv2.VideoCapture(rtsp_url)
#         if not cap.isOpened():
#             logger.error(f"Impossible d'ouvrir le flux RTSP: {rtsp_url}")
#             return
            
#         frame_count = 0
        
#         while not restart_event.is_set() and cap.isOpened():
#             # Lire une frame
#             ret, frame = cap.read()
#             if not ret:
#                 logger.warning("Échec de lecture du flux RTSP")
#                 time.sleep(1)
#                 continue
                
#             # Traiter une frame sur 5 pour alléger le processus
#             frame_count += 1
#             if frame_count % 5 != 0:
#                 continue
                
#             # Détection avec YOLOv8
#             if yolo_model:
#                 try:
#                     # Détection d'objets
#                     results = yolo_model(frame, conf=0.25)
                    
#                     # Comptage des objets par classe
#                     objects_detected = {}
#                     if results and results[0].boxes:
#                         for box in results[0].boxes:
#                             cls = int(box.cls[0])
#                             class_name = results[0].names[cls]
#                             if class_name in objects_detected:
#                                 objects_detected[class_name] += 1
#                             else:
#                                 objects_detected[class_name] = 1
                    
#                     # Détection de visages
#                     face_results = face_model(frame, conf=0.25)
#                     face_count = len(face_results[0].boxes) if face_results and face_results[0].boxes else 0
                    
#                     # Mettre à jour les résultats de détection
#                     detection_results = {
#                         "objects": objects_detected,
#                         "faces": face_count,
#                         "last_update": time.strftime("%H:%M:%S")
#                     }
                    
#                     # Créer et sauvegarder une image annotée
#                     annotated_frame = draw_boxes(frame, results[0])
#                     # Ajouter les annotations de visages
#                     annotated_frame = draw_boxes(annotated_frame, face_results[0], is_face=True)
                    
#                     # Enregistrer l'image annotée
#                     cv2.imwrite(f"{HLS_ANALYTICS_DIR}/latest_detection.jpg", annotated_frame)
                    
#                 except Exception as e:
#                     logger.error(f"Erreur lors de la détection: {str(e)}")
            
#             time.sleep(0.2)  # Pour éviter une utilisation trop intensive du CPU
            
#         cap.release()
#         logger.info("Thread de détection AI terminé")
        
#     except Exception as e:
#         logger.error(f"Erreur dans le thread de détection AI: {str(e)}")

# def start_hls_conversion(rtsp_url):
#     """Démarre la conversion RTSP vers HLS"""
#     global current_process, active_rtsp_url
    
#     # Nettoyer les anciens fichiers .ts et .m3u8
#     for file in os.listdir(HLS_OUTPUT_DIR):
#         file_path = os.path.join(HLS_OUTPUT_DIR, file)
#         if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#             os.remove(file_path)
    
#     # Commande FFmpeg pour convertir RTSP en HLS avec conservation de tous les segments
#     ffmpeg_cmd = [
#         "ffmpeg",
#         "-hide_banner",
#         "-loglevel", "error",
#         "-fflags", "+genpts",
#         "-rtsp_transport", "tcp",
#         "-i", rtsp_url,
#         "-c:v", "copy",               # Copy video codec
#         "-c:a", "aac",                # Convert audio to AAC
#         "-hls_time", "2",             # Segment duration in seconds
#         "-hls_list_size", "0",        # 0 = conserver tous les segments dans la playlist
#         "-hls_flags", "append_list",  # Ajouter à la playlist au lieu de la remplacer
#         "-hls_segment_filename", f"{HLS_OUTPUT_DIR}/segment_%03d.ts",
#         f"{HLS_OUTPUT_DIR}/playlist.m3u8"
#     ]
    
#     logger.info(f"Démarrage de la conversion RTSP vers HLS: {' '.join(ffmpeg_cmd)}")
    
#     with process_lock:
#         if restart_event.is_set():
#             return
            
#         # Arrêt propre de l'ancien processus
#         if current_process:
#             try:
#                 current_process.terminate()
#                 current_process.wait(timeout=5)
#             except:
#                 pass
        
#         # Démarrage du nouveau processus
#         current_process = subprocess.Popen(
#             ffmpeg_cmd,
#             stdin=subprocess.PIPE,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             universal_newlines=True
#         )
#         active_rtsp_url = rtsp_url
    
#     # Surveillance du processus
#     while not restart_event.is_set():
#         retcode = current_process.poll()
#         if retcode is not None:
#             logger.warning(f"FFmpeg s'est arrêté (code: {retcode})")
#             stderr_output = current_process.stderr.read()
#             if stderr_output:
#                 logger.error(f"Erreur FFmpeg: {stderr_output}")
#             time.sleep(2)
#             # Redémarrer le processus en cas d'erreur
#             start_hls_conversion(rtsp_url)
#             break
        
#         time.sleep(1)

# @app.get("/api/start")
# async def start_processing(
#     rtsp_url: str = Query(..., description="URL RTSP à convertir en HLS"),
#     enable_ai: bool = Query(True, description="Activer la détection AI")
# ):
#     """Démarre ou met à jour la conversion RTSP vers HLS"""
#     global restart_event, ai_enabled
    
#     # Validation de l'URL
#     if not rtsp_url.startswith("rtsp://"):
#         raise HTTPException(status_code=400, detail="URL RTSP invalide")
    
#     ai_enabled = enable_ai
    
#     # Signal de redémarrage
#     restart_event.set()
#     time.sleep(1)  # Attente pour l'arrêt propre
#     restart_event.clear()
    
#     # Démarrer le thread de conversion HLS
#     threading.Thread(
#         target=start_hls_conversion,
#         args=(rtsp_url,),
#         daemon=True
#     ).start()
    
#     # Démarrer le thread de détection AI si activé
#     if ai_enabled and (yolo_model is not None):
#         threading.Thread(
#             target=ai_detection_thread,
#             args=(rtsp_url,),
#             daemon=True
#         ).start()
    
#     return JSONResponse({
#         "status": "Conversion démarrée",
#         "rtsp_url": rtsp_url,
#         "hls_url": f"http://localhost:{HTTP_PORT}/hls/playlist.m3u8",
#         "ai_enabled": ai_enabled
#     })

# @app.get("/api/stop")
# async def stop_processing():
#     """Arrête complètement le processus"""
#     global current_process, restart_event
    
#     restart_event.set()
#     with process_lock:
#         if current_process:
#             try:
#                 current_process.terminate()
#                 current_process.wait(timeout=5)
#             except:
#                 pass
#             current_process = None
    
#     return JSONResponse({"status": "Flux HLS arrêté"})

# @app.get("/api/status")
# async def get_status():
#     """Retourne le statut actuel"""
#     is_active = False
#     with process_lock:
#         if current_process and current_process.poll() is None:
#             is_active = True
    
#     # Vérifier si le fichier playlist existe
#     playlist_exists = os.path.exists(f"{HLS_OUTPUT_DIR}/playlist.m3u8")
    
#     # Compter les segments .ts
#     ts_segments = [f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')]
    
#     return JSONResponse({
#         "active": is_active,
#         "current_rtsp_url": active_rtsp_url,
#         "hls_playlist_exists": playlist_exists,
#         "segment_count": len(ts_segments),
#         "segments": sorted(ts_segments)[:10] + ["..."] if len(ts_segments) > 10 else sorted(ts_segments),
#         "ai_enabled": ai_enabled,
#         "ai_detection": detection_results if ai_enabled else None
#     })

# @app.get("/api/analytics/image")
# async def get_latest_detection():
#     """Retourne la dernière image avec détection"""
#     image_path = f"{HLS_ANALYTICS_DIR}/latest_detection.jpg"
    
#     if os.path.exists(image_path):
#         return FileResponse(image_path)
#     else:
#         raise HTTPException(status_code=404, detail="Image de détection non disponible")

# @app.get("/api/cleanup")
# async def cleanup_segments(
#     keep_last: int = Query(0, description="Nombre de segments récents à conserver (0 pour tout garder)")
# ):
#     """Nettoie les anciens segments tout en préservant les plus récents"""
#     try:
#         ts_segments = sorted([f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')])
        
#         if keep_last > 0 and len(ts_segments) > keep_last:
#             segments_to_delete = ts_segments[:-keep_last]
#             for segment in segments_to_delete:
#                 segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
#                 os.remove(segment_path)
#             return JSONResponse({
#                 "status": "Nettoyage effectué",
#                 "segments_deleted": len(segments_to_delete),
#                 "segments_kept": min(keep_last, len(ts_segments))
#             })
#         else:
#             return JSONResponse({
#                 "status": "Aucun nettoyage nécessaire",
#                 "segment_count": len(ts_segments)
#             })
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des segments: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors du nettoyage",
#             "error": str(e)
#         }, status_code=500)

# # Montage des fichiers statiques pour l'accès HLS
# app.mount("/hls", StaticFiles(directory=HLS_OUTPUT_DIR), name="hls")

# @app.on_event("startup")
# async def startup_event():
#     """Actions à exécuter au démarrage"""
#     # Nettoyer les fichiers HLS existants
#     if os.path.exists(HLS_OUTPUT_DIR):
#         for item in os.listdir(HLS_OUTPUT_DIR):
#             item_path = os.path.join(HLS_OUTPUT_DIR, item)
#             if os.path.isfile(item_path) and (item.endswith('.ts') or item.endswith('.m3u8')):
#                 os.unlink(item_path)
    
#     # Nettoyer les fichiers d'analyse
#     if os.path.exists(HLS_ANALYTICS_DIR):
#         for item in os.listdir(HLS_ANALYTICS_DIR):
#             item_path = os.path.join(HLS_ANALYTICS_DIR, item)
#             if os.path.isfile(item_path):
#                 os.unlink(item_path)

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT, log_level="info")



#################### teste  ######################


# import os
# import subprocess
# import threading
# import time
# import cv2
# import numpy as np
# import logging
# from pathlib import Path
# from fastapi import FastAPI, Query, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.staticfiles import StaticFiles
# from ultralytics import YOLO
# import shutil
# import queue

# # Configuration du logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="RTSP to HLS Converter with AI Detection and Storage")

# # Configuration
# HLS_OUTPUT_DIR = "tmp/hls_output"
# HLS_ANALYTICS_DIR = f"{HLS_OUTPUT_DIR}/analytics"
# HTTP_PORT = 8020
# PIPE_PATH = "tmp/ffmpeg_pipe.yuv"

# # S'assurer que les répertoires existent
# Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
# Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
# Path(os.path.dirname(PIPE_PATH)).mkdir(parents=True, exist_ok=True)

# # Charger les modèles YOLO une seule fois au démarrage
# try:
#     yolo_model = YOLO("yolov8n.pt")  # Modèle général pour la détection d'objets
#     face_model = YOLO("yolov8n-face.pt")  # Modèle spécifique pour la détection de visages
#     logger.info("Modèles YOLO chargés avec succès")
# except Exception as e:
#     logger.error(f"Erreur lors du chargement des modèles YOLO: {str(e)}")
#     yolo_model = None
#     face_model = None

# # Variables globales
# current_process = None
# frame_queue = queue.Queue(maxsize=30)  # Pour la communication entre threads
# process_lock = threading.Lock()
# restart_event = threading.Event()
# active_rtsp_url = None
# ai_enabled = True
# detection_results = {
#     "objects": {},
#     "faces": 0,
#     "last_update": None
# }

# # Liste des transports RTSP à essayer
# rtsp_transports = ["tcp", "udp", "http", "udp_multicast"]

# def draw_boxes(frame, results, is_face=False):
#     """Dessine les boîtes de détection sur l'image"""
#     annotated_frame = frame.copy()
    
#     if results.boxes:
#         for box in results.boxes:
#             # Récupérer les coordonnées et la classe
#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             conf = float(box.conf[0])
            
#             if is_face:
#                 # Rouge pour les visages
#                 color = (0, 0, 255)
#                 label = f"Face: {conf:.2f}"
#             else:
#                 # Vert pour les objets
#                 color = (0, 255, 0)
#                 cls = int(box.cls[0])
#                 class_name = results.names[cls]
#                 label = f"{class_name}: {conf:.2f}"
            
#             # Dessiner la boîte
#             cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            
#             # Ajouter le texte
#             cv2.putText(
#                 annotated_frame, 
#                 label, 
#                 (x1, y1 - 10), 
#                 cv2.FONT_HERSHEY_SIMPLEX, 
#                 0.5, 
#                 color, 
#                 2
#             )
    
#     return annotated_frame

# def rtsp_reader_thread(rtsp_url):
#     """Thread amélioré avec gestion robuste des connexions RTSP"""
#     global detection_results
    
#     logger.info(f"Démarrage du thread de lecture RTSP pour: {rtsp_url}")
    
#     # Configuration
#     max_retries = 5  # Augmentez le nombre de tentatives
#     retry_delay = 5
#     frame_timeout = 30  # Augmentez le timeout
    
#     while not restart_event.is_set():
#         cap = None
#         ffmpeg_process = None
#         last_frame_time = time.time()
        
#         try:
#             # Phase de connexion avec réessais
#             for attempt in range(max_retries):
#                 if restart_event.is_set():
#                     break
                    
#                 try:
#                     # Essayer différents transports
#                     for transport in rtsp_transports:
#                         try:
#                             logger.info(f"Tentative {attempt+1}/{max_retries} avec transport {transport}")
#                             os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = f"rtsp_transport;{transport}"
                            
#                             # Ouvrir le flux avec timeout
#                             cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
#                             cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 30000)  # 30s timeout
                            
#                             if not cap.isOpened():
#                                 raise Exception("Échec d'ouverture du flux")
                                
#                             # Configurer le buffer minimum
#                             cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
#                             cap.set(cv2.CAP_PROP_FPS, 30)
                            
#                             width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#                             height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
#                             fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
                            
#                             logger.info(f"Connexion établie: {width}x{height}@{fps}fps")
                            
#                             # Configurer FFmpeg
#                             ffmpeg_process = configure_ffmpeg(width, height, fps)
#                             if not ffmpeg_process:
#                                 raise Exception("Échec configuration FFmpeg")
                            
#                             break  # Sortir de la boucle si succès
                            
#                         except Exception as e:
#                             logger.warning(f"Échec transport {transport}: {str(e)}")
#                             if cap:
#                                 cap.release()
#                             time.sleep(1)
#                     else:
#                         continue  # Si aucun transport n'a fonctionné
                    
#                     break  # Sortir de la boucle de réessais si succès
                    
#                 except Exception as e:
#                     logger.error(f"Tentative {attempt+1} échouée: {str(e)}")
#                     if attempt < max_retries - 1:
#                         time.sleep(retry_delay)
            
#             # Vérifier que la capture est ouverte
#             if not cap or not cap.isOpened() or not ffmpeg_process:
#                 logger.error("Échec après toutes les tentatives de connexion")
#                 time.sleep(5)  # Attendre avant de réessayer
#                 continue
                
#             # Boucle principale de traitement des images
#             frame_count = 0
#             consecutive_errors = 0
#             last_detection_time = time.time() - 10  # Pour forcer une détection immédiate
#             annotated_frame = None  # Pour conserver la dernière frame annotée
            
#             while not restart_event.is_set():
#                 try:
#                     # Lire une frame
#                     ret, frame = cap.read()
                    
#                     if not ret:
#                         consecutive_errors += 1
#                         logger.warning(f"Échec de lecture de frame ({consecutive_errors}/10)")
#                         if consecutive_errors >= 10:
#                             logger.error("Trop d'erreurs consécutives, reconnexion...")
#                             break
#                         time.sleep(0.1)
#                         continue
                    
#                     # Réinitialiser le compteur d'erreurs si frame reçue
#                     consecutive_errors = 0
#                     last_frame_time = time.time()
#                     frame_count += 1
                    
#                     # Préparer la frame à encoder (par défaut, utiliser frame originale)
#                     frame_to_encode = frame.copy()
                    
#                     # Faire la détection AI à intervalle régulier (toutes les 1 secondes)
#                     if ai_enabled and time.time() - last_detection_time > 1.0:
#                         # Effectuer la détection d'objets avec YOLO
#                         object_results = []
#                         if yolo_model:
#                             object_results = yolo_model(frame)
                            
#                             # Mettre à jour les résultats de détection
#                             objects_detected = {}
#                             for r in object_results:
#                                 if r.boxes:
#                                     for box in r.boxes:
#                                         cls = int(box.cls[0])
#                                         class_name = r.names[cls]
#                                         if class_name in objects_detected:
#                                             objects_detected[class_name] += 1
#                                         else:
#                                             objects_detected[class_name] = 1
                            
#                             detection_results["objects"] = objects_detected
                        
#                         # Effectuer la détection de visages
#                         face_results = []
#                         if face_model:
#                             face_results = face_model(frame)
                            
#                             # Compter les visages
#                             face_count = 0
#                             for r in face_results:
#                                 if r.boxes:
#                                     face_count += len(r.boxes)
                            
#                             detection_results["faces"] = face_count
                        
#                         # Mettre à jour le timestamp
#                         detection_results["last_update"] = time.strftime("%Y-%m-%d %H:%M:%S")
                        
#                         # Créer une image annotée pour visualisation et flux HLS
#                         annotated_frame = frame.copy()
                        
#                         # Appliquer les annotations des objets
#                         if yolo_model:
#                             for r in object_results:
#                                 annotated_frame = draw_boxes(annotated_frame, r, False)
                                
#                         # Appliquer les annotations des visages
#                         if face_model:
#                             for r in face_results:
#                                 annotated_frame = draw_boxes(annotated_frame, r, True)
                        
#                         # Sauvegarder l'image annotée dans le dossier analytics
#                         cv2.imwrite(f"{HLS_ANALYTICS_DIR}/latest_detection.jpg", annotated_frame)
                        
#                         # Utiliser cette frame annotée pour l'encodage HLS
#                         frame_to_encode = annotated_frame
                        
#                         # Mettre à jour le timestamp de dernière détection
#                         last_detection_time = time.time()
#                     elif ai_enabled and annotated_frame is not None:
#                         # Entre les détections, utiliser la dernière frame annotée comme base
#                         # mais mettre à jour avec la nouvelle image
#                         current_frame = frame.copy()
#                         h, w = current_frame.shape[:2]
#                         annotated_h, annotated_w = annotated_frame.shape[:2]
                        
#                         # S'assurer que les dimensions correspondent
#                         if h == annotated_h and w == annotated_w:
#                             # Superposer les détections de la frame annotée sur la frame actuelle
#                             # Détection des boîtes de couleur dans la frame annotée
#                             diff = cv2.absdiff(frame, annotated_frame)
#                             mask = np.any(diff > 50, axis=2).astype(np.uint8) * 255
                            
#                             # Dilater le masque pour prendre les boîtes complètes
#                             kernel = np.ones((5, 5), np.uint8)
#                             mask = cv2.dilate(mask, kernel, iterations=2)
                            
#                             # Fusionner les zones significatives des deux images
#                             alpha = 0.7
#                             frame_to_encode = cv2.addWeighted(frame, 1.0, annotated_frame, alpha, 0)
#                         else:
#                             # Si les dimensions ne correspondent pas, utiliser juste la nouvelle frame
#                             frame_to_encode = frame.copy()
                    
#                     # Encoder la frame pour FFmpeg
#                     _, encoded_frame = cv2.imencode('.jpg', frame_to_encode, [cv2.IMWRITE_JPEG_QUALITY, 90])
                    
#                     # Vérifier si FFmpeg est toujours en cours d'exécution
#                     if ffmpeg_process.poll() is not None:
#                         logger.error("FFmpeg s'est arrêté de façon inattendue, redémarrage...")
#                         break
                    
#                     # Envoyer la frame à FFmpeg
#                     try:
#                         ffmpeg_process.stdin.write(encoded_frame.tobytes())
#                         ffmpeg_process.stdin.flush()
#                     except (BrokenPipeError, IOError) as e:
#                         logger.error(f"Erreur d'écriture vers FFmpeg: {str(e)}")
#                         break
                    
#                     # Vérifier si on n'a pas reçu de frame depuis longtemps
#                     if time.time() - last_frame_time > frame_timeout:
#                         logger.warning(f"Aucune frame reçue depuis {frame_timeout} secondes, reconnexion...")
#                         break
                    
#                     # Contrôle de débit pour éviter de surcharger le système
#                     if frame_count % 100 == 0:
#                         logger.info(f"Frames traitées: {frame_count}")
                    
#                 except Exception as e:
#                     logger.error(f"Erreur dans la boucle de traitement: {str(e)}")
#                     time.sleep(1)
                    
#         except Exception as e:
#             logger.error(f"Erreur dans le thread de lecture RTSP: {str(e)}")
        
#         # Nettoyage
#         try:
#             if cap:
#                 cap.release()
            
#             if ffmpeg_process and ffmpeg_process.poll() is None:
#                 try:
#                     ffmpeg_process.stdin.close()
#                     ffmpeg_process.wait(timeout=5)
#                 except Exception as e:
#                     logger.warning(f"Impossible de fermer proprement FFmpeg: {str(e)}")
#                     ffmpeg_process.kill()
#         except Exception as e:
#             logger.error(f"Erreur lors du nettoyage: {str(e)}")
        
#         # Attendre avant de réessayer
#         if not restart_event.is_set():
#             logger.info("Attente avant reconnexion...")
#             time.sleep(5)

# def configure_ffmpeg(width, height, fps):
#     """Configure FFmpeg avec des paramètres plus robustes"""
#     try:
#         ffmpeg_cmd = [
#             "ffmpeg",
#             "-hide_banner",
#             "-loglevel", "error",
#             "-f", "image2pipe",
#             "-framerate", str(fps),
#             "-i", "-",
#             "-c:v", "libx264",
#             "-preset", "ultrafast",
#             "-tune", "zerolatency",
#             "-b:v", "2M",
#             "-hls_time", "2",
#             "-hls_list_size", "0",  # Valeur 0 pour garder tous les segments dans la playlist
#             "-hls_flags", "append_list",  # Supprimer delete_segments pour conserver les segments
#             "-hls_segment_filename", f"{HLS_OUTPUT_DIR}/segment_%06d.ts",  # Format avec plus de chiffres pour supporter plus de segments
#             f"{HLS_OUTPUT_DIR}/playlist.m3u8"
#         ]
        
#         logger.info(f"Configuration FFmpeg: {' '.join(ffmpeg_cmd)}")
        
#         return subprocess.Popen(
#             ffmpeg_cmd,
#             stdin=subprocess.PIPE,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             bufsize=10**8  # Buffer très important
#         )
#     except Exception as e:
#         logger.error(f"Erreur configuration FFmpeg: {str(e)}")
#         return None

# def start_hls_conversion_with_detection(rtsp_url):
#     """Démarre la conversion RTSP vers HLS avec détection AI intégrée"""
#     global current_process, active_rtsp_url
    
#     # Préparer le répertoire sans supprimer les fichiers existants
#     prepare_hls_directory()
    
#     # Démarrer le thread de lecture RTSP avec détection AI
#     threading.Thread(
#         target=rtsp_reader_thread,
#         args=(rtsp_url,),
#         daemon=True
#     ).start()
    
#     active_rtsp_url = rtsp_url

# def prepare_hls_directory():
#     """Prépare le répertoire HLS sans supprimer les fichiers existants"""
#     try:
#         # S'assurer que les répertoires existent
#         Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
#         Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
        
#         # Optionnel: archiver l'ancienne playlist.m3u8 si elle existe
#         playlist_path = os.path.join(HLS_OUTPUT_DIR, "playlist.m3u8")
#         if os.path.exists(playlist_path):
#             timestamp = time.strftime("%Y%m%d-%H%M%S")
#             archive_path = os.path.join(HLS_OUTPUT_DIR, f"playlist_archive_{timestamp}.m3u8")
#             shutil.copy2(playlist_path, archive_path)
#             logger.info(f"Playlist existante archivée sous: {archive_path}")
        
#         logger.info("Répertoire HLS préparé")
#     except Exception as e:
#         logger.error(f"Erreur lors de la préparation du répertoire HLS: {str(e)}")

# @app.get("/api/start")
# async def start_processing(
#     rtsp_url: str = Query(..., description="URL RTSP à convertir en HLS"),
#     enable_ai: bool = Query(True, description="Activer la détection AI")
# ):
#     """Démarre ou met à jour la conversion RTSP vers HLS avec détection AI"""
#     global restart_event, ai_enabled
    
#     # Validation de l'URL
#     if not rtsp_url.startswith("rtsp://"):
#         raise HTTPException(status_code=400, detail="URL RTSP invalide")
    
#     ai_enabled = enable_ai
    
#     # Signal de redémarrage
#     restart_event.set()
#     time.sleep(1)  # Attente pour l'arrêt propre
#     restart_event.clear()
    
#     # Démarrer la conversion avec détection AI
#     start_hls_conversion_with_detection(rtsp_url)
    
#     return JSONResponse({
#         "status": "Conversion avec AI intégrée démarrée",
#         "rtsp_url": rtsp_url,
#         "hls_url": f"http://localhost:{HTTP_PORT}/hls/playlist.m3u8",
#         "ai_enabled": ai_enabled
#     })

# @app.get("/api/stop")
# async def stop_processing():
#     """Arrête le processus de conversion sans nettoyer les fichiers"""
#     global restart_event, active_rtsp_url
    
#     restart_event.set()
#     time.sleep(1)  # Attendre l'arrêt propre des threads
#     active_rtsp_url = None
    
#     return JSONResponse({
#         "status": "Flux HLS arrêté (fichiers conservés)",
#         "segments_directory": HLS_OUTPUT_DIR
#     })

# @app.get("/api/clean")
# async def clean_files():
#     """Nettoie tous les fichiers HLS (segments et playlist) et le dossier analytics"""
#     try:
#         # Supprimer tous les fichiers .ts et .m3u8
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
        
#         # Nettoyer le dossier analytics
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
        
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
        
#         return JSONResponse({"status": "Tous les fichiers HLS et analytics ont été supprimés"})
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors du nettoyage",
#             "error": str(e)
#         }, status_code=500)

# @app.get("/api/status")
# async def get_status():
#     """Retourne le statut actuel"""
#     is_active = not restart_event.is_set() and active_rtsp_url is not None
    
#     # Vérifier si le fichier playlist existe
#     playlist_exists = os.path.exists(f"{HLS_OUTPUT_DIR}/playlist.m3u8")
    
#     # Compter les segments .ts
#     ts_segments = [f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')]
    
#     # Calculer l'espace disque utilisé
#     total_size_bytes = 0
#     for segment in ts_segments:
#         segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
#         total_size_bytes += os.path.getsize(segment_path)
    
#     total_size_mb = total_size_bytes / (1024 * 1024)
    
#     return JSONResponse({
#         "active": is_active,
#         "current_rtsp_url": active_rtsp_url,
#         "hls_playlist_exists": playlist_exists,
#         "segment_count": len(ts_segments),
#         "segments": sorted(ts_segments)[:10] + ["..."] if len(ts_segments) > 10 else sorted(ts_segments),
#         "ai_enabled": ai_enabled,
#         "ai_detection": detection_results if ai_enabled else None,
#         "disk_usage_mb": round(total_size_mb, 2)
#     })

# @app.get("/api/analytics/image")
# async def get_latest_detection():
#     """Retourne la dernière image avec détection"""
#     image_path = f"{HLS_ANALYTICS_DIR}/latest_detection.jpg"
    
#     if os.path.exists(image_path):
#         return FileResponse(image_path)
#     else:
#         raise HTTPException(status_code=404, detail="Image de détection non disponible")

# @app.get("/api/cleanup")
# async def cleanup_segments(
#     keep_last: int = Query(0, description="Nombre de segments récents à conserver (0 pour tout garder)")
# ):
#     """Nettoie les anciens segments tout en préservant les plus récents"""
#     try:
#         ts_segments = sorted([f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')])
        
#         if keep_last > 0 and len(ts_segments) > keep_last:
#             segments_to_delete = ts_segments[:-keep_last]
#             for segment in segments_to_delete:
#                 segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
#                 os.remove(segment_path)
            
#             # Nettoyer le dossier analytics si on fait un nettoyage des segments
#             analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#             if os.path.exists(analytics_dir):
#                 for file in os.listdir(analytics_dir):
#                     file_path = os.path.join(analytics_dir, file)
#                     if os.path.isfile(file_path):
#                         os.remove(file_path)
#                 logger.info("Nettoyage du dossier analytics effectué")
            
#             return JSONResponse({
#                 "status": "Nettoyage effectué",
#                 "segments_deleted": len(segments_to_delete),
#                 "segments_kept": min(keep_last, len(ts_segments)),
#                 "analytics_cleaned": True
#             })
#         else:
#             return JSONResponse({
#                 "status": "Aucun nettoyage nécessaire",
#                 "segment_count": len(ts_segments)
#             })
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des segments: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors du nettoyage",
#             "error": str(e)
#         }, status_code=500)

# # Montage des fichiers statiques pour l'accès HLS
# app.mount("/hls", StaticFiles(directory=HLS_OUTPUT_DIR), name="hls")

# @app.on_event("startup")
# async def startup_event():
#     """Actions à exécuter au démarrage"""
#     # Créer les répertoires si nécessaire, mais ne pas supprimer les fichiers
#     Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
#     Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
#     logger.info("Application démarrée et prête à recevoir des connexions")

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT, log_level="info")










########################################## test 2 ######################################

# ### api_rtsp_to_hls.py
# import os
# import subprocess
# import threading
# import time
# import cv2
# import numpy as np
# import logging
# from pathlib import Path
# from fastapi import FastAPI, Query, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.staticfiles import StaticFiles
# from ultralytics import YOLO
# import shutil
# import queue
# from collections import defaultdict
# import signal
# import sys




# # Configuration du logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="RTSP to HLS Converter with AI Detection and Tracking")

# # Configuration
# HLS_OUTPUT_DIR = "tmp/hls_output"
# HLS_ANALYTICS_DIR = f"{HLS_OUTPUT_DIR}/analytics"
# HTTP_PORT = 8020
# PIPE_PATH = "tmp/ffmpeg_pipe.yuv"

# # S'assurer que les répertoires existent
# Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
# Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
# Path(os.path.dirname(PIPE_PATH)).mkdir(parents=True, exist_ok=True)

# # Charger les modèles YOLO une seule fois au démarrage
# try:
#     # Utiliser les modèles avec le tracking activé
#     yolo_model = YOLO("yolov8n.pt")
#     face_model = YOLO("yolov8n-face.pt")
#     logger.info("Modèles YOLO chargés avec succès")
# except Exception as e:
#     logger.error(f"Erreur lors du chargement des modèles YOLO: {str(e)}")
#     yolo_model = None
#     face_model = None

# # Variables globales
# current_process = None
# detection_queue = queue.Queue(maxsize=10)  # File d'attente pour les détections
# process_lock = threading.Lock()
# restart_event = threading.Event()
# active_rtsp_url = None
# ai_enabled = True
# detection_results = {
#     "objects": {},
#     "faces": 0,
#     "last_update": None,
#     "tracked_objects": {}  # Pour stocker les objets suivis avec leurs IDs
# }





# def signal_handler(sig, frame):
#     """Gestionnaire de signal pour l'arrêt propre de l'application"""
#     logger.info("Signal d'arrêt reçu, nettoyage en cours...")
    
#     # Nettoyer tous les fichiers du dossier HLS
#     try:
#         # Supprimer tous les fichiers .ts et .m3u8
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
        
#         # Nettoyer le dossier analytics
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
        
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
    
#     sys.exit(0)

# # Enregistrer le gestionnaire de signal
# signal.signal(signal.SIGINT, signal_handler)  # Ctrl+C
# signal.signal(signal.SIGTERM, signal_handler)  # kill



# # Liste des transports RTSP à essayer
# rtsp_transports = ["tcp", "udp", "http", "udp_multicast"]

# def draw_boxes_with_tracking(frame, results):
#     """Dessine les boîtes de détection avec IDs de tracking sur l'image avec un meilleur rendu"""
#     annotated_frame = frame.copy()
    
#     # Extraire les IDs de tracking et les boîtes
#     if hasattr(results, 'boxes') and results.boxes:
#         for box in results.boxes:
#             # Récupérer les coordonnées et la classe
#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             conf = float(box.conf[0])
#             cls = int(box.cls[0])
#             class_name = results.names[cls]
            
#             # Couleurs basées sur la classe
#             if class_name == "person":
#                 color = (0, 255, 0)  # Vert pour les personnes
#             elif "face" in class_name.lower():
#                 color = (0, 0, 255)  # Rouge pour les visages
#             else:
#                 color = (255, 0, 0)  # Bleu pour les autres objets
            
#             # Récupérer l'ID de tracking si disponible
#             track_id = None
#             if hasattr(box, 'id') and box.id is not None:
#                 track_id = int(box.id[0])
#                 # Mettre à jour les objets suivis dans detection_results
#                 if track_id not in detection_results["tracked_objects"]:
#                     detection_results["tracked_objects"][track_id] = {
#                         "class": class_name,
#                         "first_seen": time.time(),
#                         "last_seen": time.time(),
#                         "position": (int((x1+x2)/2), int((y1+y2)/2))
#                     }
#                 else:
#                     detection_results["tracked_objects"][track_id]["last_seen"] = time.time()
#                     detection_results["tracked_objects"][track_id]["position"] = (int((x1+x2)/2), int((y1+y2)/2))
                
#                 label = f"{class_name} #{track_id}: {conf:.2f}"
#             else:
#                 label = f"{class_name}: {conf:.2f}"
            
#             # Dessiner la boîte avec une ligne plus fine pour moins dégrader l'image
#             cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)  # Épaisseur réduite à 2
            
#             # Fond semi-transparent pour le texte
#             text_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
#             cv2.rectangle(annotated_frame, 
#                          (x1, y1 - text_size[1] - 10), 
#                          (x1 + text_size[0], y1), 
#                          color, -1)  # Remplir le rectangle
            
#             # Ajouter le texte avec une meilleure visibilité
#             cv2.putText(
#                 annotated_frame, 
#                 label, 
#                 (x1, y1 - 5), 
#                 cv2.FONT_HERSHEY_SIMPLEX, 
#                 0.5, 
#                 (255, 255, 255),  # Texte blanc pour contraste
#                 1  # Épaisseur réduite
#             )
    
#     return annotated_frame

# def detection_worker():
#     """Thread dédié à l'analyse d'images pour ne pas bloquer le flux vidéo"""
#     global detection_results
    
#     logger.info("Démarrage du thread de détection AI")
    
#     detection_queue.maxsize = 5  # Réduit la taille de la file pour éviter l'accumulation
#     last_annotated_hash = None  # Pour vérifier les changements dans la frame annotée
    
#     while not restart_event.is_set():
#         try:
#             if detection_queue.empty():
#                 time.sleep(0.01)
#                 continue
                
#             frame = detection_queue.get()
            
#             objects_detected = defaultdict(int)
#             face_count = 0
#             annotated_frame = frame.copy()
            
#             if yolo_model:
#                 object_results = yolo_model.track(frame, persist=True, tracker="bytetrack.yaml")
#                 for r in object_results:
#                     annotated_frame = draw_boxes_with_tracking(annotated_frame, r)
#                     if r.boxes:
#                         for box in r.boxes:
#                             cls = int(box.cls[0])
#                             class_name = r.names[cls]
#                             objects_detected[class_name] += 1
            
#             if face_model:
#                 face_results = face_model.track(frame, persist=True, tracker="bytetrack.yaml")
#                 for r in face_results:
#                     annotated_frame = draw_boxes_with_tracking(annotated_frame, r)
#                     if r.boxes:
#                         face_count += len(r.boxes)
            
#             detection_results["objects"] = dict(objects_detected)
#             detection_results["faces"] = face_count
#             detection_results["last_update"] = time.strftime("%Y-%m-%d %H:%M:%S")
            
#             current_time = time.time()
#             to_remove = []
#             for track_id, obj_info in detection_results["tracked_objects"].items():
#                 if current_time - obj_info["last_seen"] > 5.0:
#                     to_remove.append(track_id)
            
#             for track_id in to_remove:
#                 del detection_results["tracked_objects"][track_id]
            
#             # Calculer un hash simple de la frame annotée pour vérifier les changements
#             import hashlib
#             frame_hash = hashlib.md5(annotated_frame.tobytes()).hexdigest()
            
#             # Sauvegarder uniquement si la frame a changé
#             if frame_hash != last_annotated_hash:
#                 with open(f"{HLS_ANALYTICS_DIR}/annotated_frame.npy", 'wb') as f:
#                     np.save(f, annotated_frame)
#                 last_annotated_hash = frame_hash
                
#         except Exception as e:
#             logger.error(f"Erreur dans le thread de détection: {str(e)}")
#             time.sleep(0.1)

# def rtsp_reader_thread(rtsp_url):
#     """Thread amélioré avec meilleure gestion de flux et tracking"""
#     global detection_results
    
#     logger.info(f"Démarrage du thread de lecture RTSP pour: {rtsp_url}")
    
#     # Configuration
#     max_retries = 5
#     retry_delay = 5
#     frame_timeout = 30
#     detection_interval = 0.2  # Analyser toutes les 0.2 secondes au lieu de 1 seconde
    
#     # Démarrer le thread de détection AI séparé
#     detection_thread = threading.Thread(target=detection_worker, daemon=True)
#     detection_thread.start()
    
#     while not restart_event.is_set():
#         cap = None
#         ffmpeg_process = None
#         last_frame_time = time.time()
        
#         try:
#             # Phase de connexion avec réessais
#             for attempt in range(max_retries):
#                 if restart_event.is_set():
#                     break
                    
#                 try:
#                     # Essayer différents transports
#                     for transport in rtsp_transports:
#                         try:
#                             logger.info(f"Tentative {attempt+1}/{max_retries} avec transport {transport}")
#                             os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = f"rtsp_transport;{transport}"
                            
#                             # Ouvrir le flux avec timeout
#                             cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
#                             cap.set(cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, 10000)  # Réduit de 30000 à 10000
#                             cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Buffer minimal
#                             cap.set(cv2.CAP_PROP_FPS, 30)
                            
#                             if not cap.isOpened():
#                                 raise Exception("Échec d'ouverture du flux")
                            
#                             width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#                             height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
#                             fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
                            
#                             logger.info(f"Connexion établie: {width}x{height}@{fps}fps")
                            
#                             # Configurer FFmpeg
#                             ffmpeg_process = configure_ffmpeg(width, height, fps)
#                             if not ffmpeg_process:
#                                 raise Exception("Échec configuration FFmpeg")
                            
#                             break  # Sortir de la boucle si succès
                            
#                         except Exception as e:
#                             logger.warning(f"Échec transport {transport}: {str(e)}")
#                             if cap:
#                                 cap.release()
#                             time.sleep(1)
#                     else:
#                         continue  # Si aucun transport n'a fonctionné
                        
#                     break  # Sortir de la boucle de réessais si succès
                    
#                 except Exception as e:
#                     logger.error(f"Tentative {attempt+1} échouée: {str(e)}")
#                     if attempt < max_retries - 1:
#                         time.sleep(retry_delay)
            
#             # Vérifier que la capture est ouverte
#             if not cap or not cap.isOpened() or not ffmpeg_process:
#                 logger.error("Échec après toutes les tentatives de connexion")
#                 time.sleep(5)  # Attendre avant de réessayer
#                 continue
                
#             # Boucle principale de traitement des images
#             frame_count = 0
#             consecutive_errors = 0
#             last_detection_time = time.time() - 10  # Pour forcer une détection immédiate
#             last_annotated_frame = None

#             while not restart_event.is_set():
#                 try:
#                     # Lire une frame
#                     ret, frame = cap.read()
                    
#                     if not ret:
#                         consecutive_errors += 1
#                         logger.warning(f"Échec de lecture de frame ({consecutive_errors}/10)")
#                         if consecutive_errors >= 10:
#                             logger.error("Trop d'erreurs consécutives, reconnexion...")
#                             break
#                         time.sleep(0.1)
#                         continue
                    
#                     # Réinitialiser le compteur d'erreurs si frame reçue
#                     consecutive_errors = 0
#                     last_frame_time = time.time()
#                     frame_count += 1
                    
#                     # Préparer la frame à encoder
#                     frame_to_encode = frame.copy()
                    
#                     # Faire la détection AI à intervalle régulier (toutes les 0.2 secondes)
#                     if ai_enabled and time.time() - last_detection_time > detection_interval:
#                         # Ajouter la frame à la file d'attente pour traitement
#                         if detection_queue.full():
#                             try:
#                                 detection_queue.get_nowait()
#                             except:
#                                 pass
                        
#                         try:
#                             detection_queue.put(frame.copy(), block=False)
#                         except:
#                             pass  # Ignorer si la file est pleine
                        
#                         last_detection_time = time.time()
                    
#                     # Si AI est activée, attendre une frame annotée récente
#                     if ai_enabled:
#                         annotated_path = f"{HLS_ANALYTICS_DIR}/annotated_frame.npy"
#                         if os.path.exists(annotated_path):
#                             try:
#                                 file_mtime = os.path.getmtime(annotated_path)
#                                 if time.time() - file_mtime < 0.5:  # Frame annotée récente (moins de 0.5s)
#                                     with open(annotated_path, 'rb') as f:
#                                         last_annotated_frame = np.load(f)
#                             except Exception as e:
#                                 logger.warning(f"Erreur lors du chargement de la frame annotée: {str(e)}")
                        
#                         # Utiliser la frame annotée si disponible et compatible
#                         if last_annotated_frame is not None and last_annotated_frame.shape == frame.shape:
#                             frame_to_encode = last_annotated_frame.copy()
                    
#                     # Encoder la frame pour FFmpeg
#                     _, encoded_frame = cv2.imencode('.jpg', frame_to_encode, [cv2.IMWRITE_JPEG_QUALITY, 95])  # Réduit à 95 pour équilibrer qualité/taille
                    
#                     # Vérifier si FFmpeg est toujours en cours d'exécution
#                     if ffmpeg_process.poll() is not None:
#                         logger.error("FFmpeg s'est arrêté de façon inattendue, redémarrage...")
#                         break
                    
#                     # Envoyer la frame à FFmpeg
#                     try:
#                         ffmpeg_process.stdin.write(encoded_frame.tobytes())
#                         ffmpeg_process.stdin.flush()
#                     except (BrokenPipeError, IOError) as e:
#                         logger.error(f"Erreur d'écriture vers FFmpeg: {str(e)}")
#                         break
                    
#                     # Vérifier si on n'a pas reçu de frame depuis longtemps
#                     if time.time() - last_frame_time > frame_timeout:
#                         logger.warning(f"Aucune frame reçue depuis {frame_timeout} secondes, reconnexion...")
#                         break
                    
#                     # Contrôle de débit pour éviter de surcharger le système
#                     if frame_count % 100 == 0:
#                         logger.info(f"Frames traitées: {frame_count}")
                    
#                 except Exception as e:
#                     logger.error(f"Erreur dans la boucle de traitement: {str(e)}")
#                     time.sleep(1)
                    
#         except Exception as e:
#             logger.error(f"Erreur dans le thread de lecture RTSP: {str(e)}")
        
#         # Nettoyage
#         try:
#             if cap:
#                 cap.release()
            
#             if ffmpeg_process and ffmpeg_process.poll() is None:
#                 try:
#                     ffmpeg_process.stdin.close()
#                     ffmpeg_process.wait(timeout=5)
#                 except Exception as e:
#                     logger.warning(f"Impossible de fermer proprement FFmpeg: {str(e)}")
#                     ffmpeg_process.kill()
#         except Exception as e:
#             logger.error(f"Erreur lors du nettoyage: {str(e)}")
        
#         # Attendre avant de réessayer
#         if not restart_event.is_set():
#             logger.info("Attente avant reconnexion...")
#             time.sleep(5)

# def configure_ffmpeg(width, height, fps):
#     """Configure FFmpeg avec des paramètres optimisés pour la fluidité"""
#     try:
#         ffmpeg_cmd = [
#             "ffmpeg",
#             "-hide_banner",
#             "-loglevel", "error",
#             "-f", "image2pipe",
#             "-framerate", str(fps),
#             "-i", "-",
#             "-c:v", "libx264",
#             "-preset", "ultrafast",  # Changé à ultrafast pour minimiser le temps d'encodage
#             "-tune", "zerolatency",
#             "-crf", "18",  # Augmenté à 18 pour réduire la charge
#             "-b:v", "5000k",  # Bitrate réduit pour plus de fluidité
#             "-profile:v", "high",
#             "-pix_fmt", "yuv420p",
#             "-g", str(int(fps * 2)),
#             "-keyint_min", str(int(fps)),
#             "-hls_time", "1",  # Réduit à 1s pour moins de latence
#             "-hls_list_size", "0",
#             "-hls_flags", "append_list",
#             "-hls_segment_filename", f"{HLS_OUTPUT_DIR}/segment_%06d.ts",
#             f"{HLS_OUTPUT_DIR}/playlist.m3u8"
#         ]
        
#         logger.info(f"Configuration FFmpeg: {' '.join(ffmpeg_cmd)}")
        
#         return subprocess.Popen(
#             ffmpeg_cmd,
#             stdin=subprocess.PIPE,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             bufsize=10**8
#         )
#     except Exception as e:
#         logger.error(f"Erreur configuration FFmpeg: {str(e)}")
#         return None

# def start_hls_conversion_with_detection(rtsp_url):
#     """Démarre la conversion RTSP vers HLS avec détection AI intégrée"""
#     global current_process, active_rtsp_url
    
#     # Préparer le répertoire sans supprimer les fichiers existants
#     prepare_hls_directory()
    
#     # Démarrer le thread de lecture RTSP avec détection AI
#     threading.Thread(
#         target=rtsp_reader_thread,
#         args=(rtsp_url,),
#         daemon=True
#     ).start()
    
#     active_rtsp_url = rtsp_url

# def prepare_hls_directory():
#     """Prépare le répertoire HLS sans supprimer les fichiers existants"""
#     try:
#         # S'assurer que les répertoires existent
#         Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
#         Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
        
#         # Optionnel: archiver l'ancienne playlist.m3u8 si elle existe
#         playlist_path = os.path.join(HLS_OUTPUT_DIR, "playlist.m3u8")
#         if os.path.exists(playlist_path):
#             timestamp = time.strftime("%Y%m%d-%H%M%S")
#             archive_path = os.path.join(HLS_OUTPUT_DIR, f"playlist_archive_{timestamp}.m3u8")
#             shutil.copy2(playlist_path, archive_path)
#             logger.info(f"Playlist existante archivée sous: {archive_path}")
        
#         logger.info("Répertoire HLS préparé")
#     except Exception as e:
#         logger.error(f"Erreur lors de la préparation du répertoire HLS: {str(e)}")

# @app.get("/api/start")
# async def start_processing(
#     rtsp_url: str = Query(..., description="URL RTSP à convertir en HLS"),
#     enable_ai: bool = Query(True, description="Activer la détection AI")
# ):
#     """Démarre ou met à jour la conversion RTSP vers HLS avec détection AI"""
#     global restart_event, ai_enabled
    
#     # Validation de l'URL
#     if not rtsp_url.startswith("rtsp://"):
#         raise HTTPException(status_code=400, detail="URL RTSP invalide")
    
#     ai_enabled = enable_ai
    
#     # Signal de redémarrage
#     restart_event.set()
#     time.sleep(1)  # Attente pour l'arrêt propre
#     restart_event.clear()
    
#     # Nettoyer tous les fichiers du dossier HLS avant de commencer
#     try:
#         # Supprimer tous les fichiers .ts et .m3u8
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
        
#         # Nettoyer le dossier analytics
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
        
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué avant démarrage")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
    
#     # Démarrer la conversion avec détection AI
#     start_hls_conversion_with_detection(rtsp_url)
    
#     return JSONResponse({
#         "status": "Conversion avec AI intégrée démarrée",
#         "rtsp_url": rtsp_url,
#         "hls_url": f"http://localhost:{HTTP_PORT}/hls/playlist.m3u8",
#         "ai_enabled": ai_enabled
#     })

# @app.get("/api/stop")
# async def stop_processing():
#     """Arrête le processus de conversion et nettoie tous les fichiers"""
#     global restart_event, active_rtsp_url
    
#     restart_event.set()
#     time.sleep(1)  # Attendre l'arrêt propre des threads
#     active_rtsp_url = None
    
#     # Nettoyer tous les fichiers du dossier HLS
#     try:
#         # Supprimer tous les fichiers .ts et .m3u8
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
        
#         # Nettoyer le dossier analytics
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
        
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
    
#     return JSONResponse({
#         "status": "Flux HLS arrêté et fichiers supprimés",
#         "segments_directory": HLS_OUTPUT_DIR
#     })

# @app.get("/api/clean")
# async def clean_files():
#     """Nettoie tous les fichiers HLS (segments et playlist) et le dossier analytics"""
#     try:
#         # Supprimer tous les fichiers .ts et .m3u8
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
        
#         # Nettoyer le dossier analytics
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
        
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
        
#         return JSONResponse({"status": "Tous les fichiers HLS et analytics ont été supprimés"})
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors du nettoyage",
#             "error": str(e)
#         }, status_code=500)


# @app.get("/api/verify_cleanup")
# async def verify_cleanup():
#     """Vérifie que le dossier HLS a été nettoyé."""
#     try:
#         # Vérifier si le dossier existe et est vide
#         if os.path.exists(HLS_OUTPUT_DIR):
#             files = [f for f in os.listdir(HLS_OUTPUT_DIR) 
#                     if os.path.isfile(os.path.join(HLS_OUTPUT_DIR, f))]
#             if files:
#                 return JSONResponse({
#                     "status": "Dossier non vide",
#                     "remaining_files": files,
#                     "should_clean": True
#                 }, status_code=400)
        
#         return JSONResponse({
#             "status": "Dossier propre",
#             "details": "Aucun fichier trouvé dans le dossier HLS"
#         })
        
#     except Exception as e:
#         logger.error(f"Erreur vérification: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors de la vérification",
#             "error": str(e)
#         }, status_code=500)



# @app.get("/api/status")
# async def get_status():
#     """Retourne le statut actuel avec informations de tracking"""
#     is_active = not restart_event.is_set() and active_rtsp_url is not None
    
#     playlist_exists = os.path.exists(f"{HLS_OUTPUT_DIR}/playlist.m3u8")
    
#     ts_segments = [f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')]
    
#     total_size_bytes = 0
#     for segment in ts_segments:
#         segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
#         total_size_bytes += os.path.getsize(segment_path)
    
#     total_size_mb = total_size_bytes / (1024 * 1024)
    
#     # Vérifier si les annotations AI sont présentes dans les segments
#     annotations_in_segments = False
#     if ai_enabled and os.path.exists(f"{HLS_ANALYTICS_DIR}/annotated_frame.npy"):
#         annotations_in_segments = True
    
#     tracking_info = {}
#     if ai_enabled:
#         current_time = time.time()
#         tracked_objects_clean = {}
#         for track_id, obj_info in detection_results["tracked_objects"].items():
#             if current_time - obj_info["last_seen"] < 10.0:
#                 tracked_objects_clean[track_id] = {
#                     "class": obj_info["class"],
#                     "duration": round(current_time - obj_info["first_seen"], 1),
#                     "last_seen": round(current_time - obj_info["last_seen"], 1),
#                     "position": obj_info["position"]
#                 }
        
#         tracking_info["tracked_objects"] = tracked_objects_clean
#         tracking_info["active_tracks"] = len(tracked_objects_clean)
    
#     return JSONResponse({
#         "active": is_active,
#         "current_rtsp_url": active_rtsp_url,
#         "hls_playlist_exists": playlist_exists,
#         "segment_count": len(ts_segments),
#         "segments": sorted(ts_segments)[:10] + ["..."] if len(ts_segments) > 10 else sorted(ts_segments),
#         "ai_enabled": ai_enabled,
#         "ai_annotations_in_segments": annotations_in_segments,  # Nouvelle clé
#         "ai_detection": detection_results if ai_enabled else None,
#         "tracking": tracking_info if ai_enabled else None,
#         "disk_usage_mb": round(total_size_mb, 2)
#     })

# @app.get("/api/analytics/image")
# async def get_latest_detection():
#     """Retourne la dernière image avec détection"""
#     image_path = f"{HLS_ANALYTICS_DIR}/latest_detection.jpg"
    
#     if os.path.exists(image_path):
#         return FileResponse(image_path)
#     else:
#         raise HTTPException(status_code=404, detail="Image de détection non disponible")

# @app.get("/api/tracking/status")
# async def get_tracking_status():
#     """Retourne l'état détaillé du tracking des objets"""
#     if not ai_enabled:
#         return JSONResponse({
#             "status": "AI désactivée",
#             "tracking_enabled": False
#         })
    
#     # Nettoyer les objets suivis qui n'ont pas été vus depuis plus de 10 secondes
#     current_time = time.time()
#     tracked_objects_clean = {}
#     for track_id, obj_info in detection_results["tracked_objects"].items():
#         if current_time - obj_info["last_seen"] < 10.0:
#             tracked_objects_clean[track_id] = {
#                 "class": obj_info["class"],
#                 "duration": round(current_time - obj_info["first_seen"], 1),
#                 "last_seen": round(current_time - obj_info["last_seen"], 1),
#                 "position": obj_info["position"]
#             }
    
#     # Analyser les statistiques
#     class_counts = defaultdict(int)
#     for obj_info in tracked_objects_clean.values():
#         class_counts[obj_info["class"]] += 1
    
#     return JSONResponse({
#         "status": "Tracking actif",
#         "tracking_enabled": True,
#         "active_tracks": len(tracked_objects_clean),
#         "class_distribution": dict(class_counts),
#         "tracked_objects": tracked_objects_clean
#     })

# @app.get("/api/cleanup")
# async def cleanup_segments(
#     keep_last: int = Query(10, description="Nombre de segments récents à conserver (0 pour tout garder)")
# ):
#     """Nettoie les anciens segments tout en préservant les plus récents"""
#     try:
#         ts_segments = sorted([f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')])
        
#         if keep_last > 0 and len(ts_segments) > keep_last:
#             segments_to_delete = ts_segments[:-keep_last]
#             for segment in segments_to_delete:
#                 segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
#                 os.remove(segment_path)
            
#             return JSONResponse({
#                 "status": "Nettoyage effectué",
#                 "segments_deleted": len(segments_to_delete),
#                 "segments_kept": min(keep_last, len(ts_segments))
#             })
#         else:
#             return JSONResponse({
#                 "status": "Aucun nettoyage nécessaire",
#                 "segment_count": len(ts_segments)
#             })
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des segments: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors du nettoyage",
#             "error": str(e)
#         }, status_code=500)


# @app.on_event("shutdown")
# async def shutdown_event():
#     """Actions à exécuter à l'arrêt de l'application"""
#     logger.info("Arrêt de l'application, nettoyage des fichiers...")
    
#     # Nettoyer tous les fichiers du dossier HLS
#     try:
#         # Supprimer tous les fichiers .ts et .m3u8
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
        
#         # Nettoyer le dossier analytics
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
        
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
        
# # Montage des fichiers statiques pour l'accès HLS
# app.mount("/hls", StaticFiles(directory=HLS_OUTPUT_DIR), name="hls")


# @app.on_event("startup")
# async def startup_event():
#     """Actions à exécuter au démarrage"""
#     # Créer les répertoires si nécessaire, mais ne pas supprimer les fichiers
#     Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
#     Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
#     logger.info("Application démarrée et prête à recevoir des connexions")

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT, log_level="info")









############################# code grok ############################
# import os
# import subprocess
# import threading
# import time
# import cv2
# import numpy as np
# import logging
# from pathlib import Path
# from fastapi import FastAPI, Query, HTTPException
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.staticfiles import StaticFiles
# from ultralytics import YOLO
# import shutil
# import queue
# from collections import defaultdict
# import signal
# import sys
# import hashlib

# # Configuration du logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# app = FastAPI(title="RTSP to HLS Converter with AI Detection and Tracking")

# # Configuration
# HLS_OUTPUT_DIR = "tmp/hls_output"
# HLS_ANALYTICS_DIR = f"{HLS_OUTPUT_DIR}/analytics"
# HTTP_PORT = 8020
# PIPE_PATH = "tmp/ffmpeg_pipe.yuv"

# # S'assurer que les répertoires existent
# Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
# Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
# Path(os.path.dirname(PIPE_PATH)).mkdir(parents=True, exist_ok=True)

# # Charger les modèles YOLO une seule fois au démarrage
# try:
#     yolo_model = YOLO("yolov8n.pt").to('cuda')
#     face_model = YOLO("yolov8n-face.pt").to('cuda')
#     logger.info("Modèles YOLO chargés avec succès")
# except Exception as e:
#     logger.error(f"Erreur lors du chargement des modèles YOLO: {str(e)}")
#     yolo_model = None
#     face_model = None

# # Variables globales
# current_process = None
# detection_queue = queue.Queue(maxsize=5)  # Réduit pour éviter l'accumulation
# process_lock = threading.Lock()
# restart_event = threading.Event()
# active_rtsp_url = None
# ai_enabled = True
# detection_results = {
#     "objects": {},
#     "faces": 0,
#     "last_update": None,
#     "tracked_objects": {}
# }

# def signal_handler(sig, frame):
#     """Gestionnaire de signal pour l'arrêt propre de l'application"""
#     logger.info("Signal d'arrêt reçu, nettoyage en cours...")
#     try:
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
#     sys.exit(0)

# signal.signal(signal.SIGINT, signal_handler)
# signal.signal(signal.SIGTERM, signal_handler)

# rtsp_transports = ["tcp", "udp", "http", "udp_multicast"]

# def draw_boxes_with_tracking(frame, results):
#     """Dessine les boîtes de détection avec IDs de tracking sur l'image"""
#     annotated_frame = frame.copy()
#     if hasattr(results, 'boxes') and results.boxes:
#         for box in results.boxes:
#             x1, y1, x2, y2 = map(int, box.xyxy[0])
#             conf = float(box.conf[0])
#             cls = int(box.cls[0])
#             class_name = results.names[cls]
#             color = (0, 255, 0) if class_name == "person" else (0, 0, 255) if "face" in class_name.lower() else (255, 0, 0)
#             track_id = int(box.id[0]) if hasattr(box, 'id') and box.id is not None else None
#             if track_id:
#                 if track_id not in detection_results["tracked_objects"]:
#                     detection_results["tracked_objects"][track_id] = {
#                         "class": class_name,
#                         "first_seen": time.time(),
#                         "last_seen": time.time(),
#                         "position": (int((x1+x2)/2), int((y1+y2)/2))
#                     }
#                 else:
#                     detection_results["tracked_objects"][track_id]["last_seen"] = time.time()
#                     detection_results["tracked_objects"][track_id]["position"] = (int((x1+x2)/2), int((y1+y2)/2))
#                 label = f"{class_name} #{track_id}: {conf:.2f}"
#             else:
#                 label = f"{class_name}: {conf:.2f}"
#             cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
#             text_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
#             cv2.rectangle(annotated_frame, (x1, y1 - text_size[1] - 10), (x1 + text_size[0], y1), color, -1)
#             cv2.putText(annotated_frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
#     return annotated_frame

# def detection_worker():
#     """Thread dédié à l'analyse d'images pour ne pas bloquer le flux vidéo"""
#     global detection_results
#     logger.info("Démarrage du thread de détection AI")
#     last_annotated_hash = None
#     while not restart_event.is_set():
#         try:
#             if detection_queue.empty():
#                 time.sleep(0.01)
#                 continue
#             frame = detection_queue.get()
#             objects_detected = defaultdict(int)
#             face_count = 0
#             annotated_frame = frame.copy()
#             if yolo_model:
#                 object_results = yolo_model.track(frame, persist=True, tracker="bytetrack.yaml")
#                 for r in object_results:
#                     annotated_frame = draw_boxes_with_tracking(annotated_frame, r)
#                     if r.boxes:
#                         for box in r.boxes:
#                             cls = int(box.cls[0])
#                             class_name = r.names[cls]
#                             objects_detected[class_name] += 1
#             if face_model:
#                 face_results = face_model.track(frame, persist=True, tracker="bytetrack.yaml")
#                 for r in face_results:
#                     annotated_frame = draw_boxes_with_tracking(annotated_frame, r)
#                     if r.boxes:
#                         face_count += len(r.boxes)
#             detection_results["objects"] = dict(objects_detected)
#             detection_results["faces"] = face_count
#             detection_results["last_update"] = time.strftime("%Y-%m-%d %H:%M:%S")
#             current_time = time.time()
#             to_remove = []
#             for track_id, obj_info in detection_results["tracked_objects"].items():
#                 if current_time - obj_info["last_seen"] > 5.0:
#                     to_remove.append(track_id)
#             for track_id in to_remove:
#                 del detection_results["tracked_objects"][track_id]
#             frame_hash = hashlib.md5(annotated_frame.tobytes()).hexdigest()
#             if frame_hash != last_annotated_hash:
#                 with open(f"{HLS_ANALYTICS_DIR}/annotated_frame.npy", 'wb') as f:
#                     np.save(f, annotated_frame)
#                 last_annotated_hash = frame_hash
#         except Exception as e:
#             logger.error(f"Erreur dans le thread de détection: {str(e)}")
#             time.sleep(0.1)


# def update_detection_results(results):
#     """Met à jour les résultats de détection globaux"""
#     global detection_results
    
#     if not results or len(results) == 0:
#         return
        
#     objects_detected = defaultdict(int)
#     face_count = 0
    
#     for box in results[0].boxes:
#         cls = int(box.cls[0])
#         class_name = results[0].names[cls]
#         objects_detected[class_name] += 1
        
#         if "face" in class_name.lower():
#             face_count += 1
    
#     detection_results.update({
#         "objects": dict(objects_detected),
#         "faces": face_count,
#         "last_update": time.strftime("%Y-%m-%d %H:%M:%S")
#     })

# def rtsp_reader_thread(rtsp_url):
#     """Thread de lecture RTSP optimisé pour la fluidité avec traitement IA en temps réel"""
#     global detection_results
    
#     logger.info(f"Démarrage du thread RTSP optimisé pour: {rtsp_url}")
    
#     # Configuration basse latence
#     cv2.setNumThreads(2)  # Limiter les threads OpenCV
#     os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|buffer_size;1024000"
    
#     cap = None
#     ffmpeg_process = None
#     frame_skip_counter = 0
#     last_fps_log = time.time()
#     processed_frames = 0
    
#     while not restart_event.is_set():
#         try:
#             # Initialisation du flux
#             cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
#             cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
#             cap.set(cv2.CAP_PROP_FPS, 30)
            
#             if not cap.isOpened():
#                 raise RuntimeError(f"Échec d'ouverture du flux RTSP: {rtsp_url}")
                
#             # Configuration FFmpeg basse latence
#             width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
#             height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
#             fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            
#             ffmpeg_process = subprocess.Popen([
#                 "ffmpeg",
#                 "-y",
#                 "-loglevel", "error",
#                 "-f", "rawvideo",
#                 "-vcodec", "rawvideo",
#                 "-pix_fmt", "bgr24",
#                 "-s", f"{width}x{height}",
#                 "-r", str(fps),
#                 "-i", "-",
#                 "-c:v", "libx264",
#                 "-preset", "ultrafast",
#                 "-tune", "zerolatency",
#                 "-g", "15",
#                 "-keyint_min", "15",
#                 "-pix_fmt", "yuv420p",
#                 "-f", "hls",
#                 "-hls_time", "0.5",
#                 "-hls_flags", "independent_segments+delete_segments",
#                 "-hls_list_size", "3",
#                 f"{HLS_OUTPUT_DIR}/playlist.m3u8"
#             ], stdin=subprocess.PIPE)
            
#             # Boucle principale de traitement
#             while not restart_event.is_set() and cap.isOpened():
#                 start_time = time.time()
                
#                 # Lecture frame
#                 ret, frame = cap.read()
#                 if not ret:
#                     frame_skip_counter += 1
#                     if frame_skip_counter > 30:
#                         logger.warning("Trop de frames manquées, reconnexion...")
#                         break
#                     time.sleep(0.01)
#                     continue
                
#                 frame_skip_counter = 0
#                 processed_frames += 1
                
#                 # Traitement temps-réel
#                 display_frame = frame.copy()
#                 if ai_enabled:
#                     try:
#                         # Détection IA avec timeout
#                         results = yolo_model.track(
#                             frame, 
#                             persist=True, 
#                             verbose=False,
#                             imgsz=640,  # Réduction résolution pour YOLO
#                             half=True    # Activation float16 si GPU
#                         )
                        
#                         # Mise à jour des résultats
#                         update_detection_results(results)
                        
#                         # Annotation
#                         display_frame = draw_boxes_with_tracking(frame, results[0])
#                     except Exception as e:
#                         logger.error(f"Erreur IA: {str(e)}")
                
#                 # Encodage HLS
#                 try:
#                     ffmpeg_process.stdin.write(
#                         display_frame.tobytes()
#                     )
#                 except BrokenPipeError:
#                     logger.error("FFmpeg pipe broken, redémarrage...")
#                     break
                
#                 # Log des performances
#                 if time.time() - last_fps_log > 5.0:
#                     current_fps = processed_frames / (time.time() - last_fps_log)
#                     logger.info(f"FPS: {current_fps:.1f} | Latence: {(time.time() - start_time)*1000:.1f}ms")
#                     processed_frames = 0
#                     last_fps_log = time.time()
                
#         except Exception as e:
#             logger.error(f"Erreur dans le thread RTSP: {str(e)}")
#             time.sleep(2)
            
#         finally:
#             # Nettoyage
#             if cap:
#                 cap.release()
#             if ffmpeg_process and ffmpeg_process.poll() is None:
#                 ffmpeg_process.stdin.close()
#                 ffmpeg_process.terminate()
#                 try:
#                     ffmpeg_process.wait(timeout=5)
#                 except subprocess.TimeoutExpired:
#                     ffmpeg_process.kill()
            
#             if not restart_event.is_set():
#                 time.sleep(1)

# def configure_ffmpeg(width, height, fps):
#     """Configure FFmpeg avec des paramètres optimisés pour la fluidité"""
#     try:
#         ffmpeg_cmd = [
#             "ffmpeg",
#             "-loglevel", "error",
#             "-threads", "4",  # Utiliser plusieurs threads
#             "-fflags", "nobuffer",  # Réduire le buffering
#             "-flags", "low_delay",
#             "-strict", "experimental",
#             "-f", "image2pipe",
#             "-framerate", str(fps),
#             "-i", "-",
#             "-c:v", "libx264",
#             "-preset", "ultrafast",
#             "-tune", "zerolatency",
#             "-x264-params", "keyint=15:no-scenecut=1",  # GOP plus court
#             "-bf", "0",  # Pas de B-frames
#             "-pix_fmt", "yuv420p",
#             "-f", "hls",
#             "-hls_time", "0.5",  # Segments plus courts
#             "-hls_flags", "independent_segments+delete_segments",
#             "-hls_list_size", "3",  # Playlist plus courte
#             f"{HLS_OUTPUT_DIR}/playlist.m3u8"
#         ]
#         logger.info(f"Configuration FFmpeg: {' '.join(ffmpeg_cmd)}")
#         return subprocess.Popen(
#             ffmpeg_cmd,
#             stdin=subprocess.PIPE,
#             stdout=subprocess.PIPE,
#             stderr=subprocess.PIPE,
#             bufsize=10**8
#         )
#     except Exception as e:
#         logger.error(f"Erreur configuration FFmpeg: {str(e)}")
#         return None

# def start_hls_conversion_with_detection(rtsp_url):
#     """Démarre la conversion RTSP vers HLS avec détection AI intégrée"""
#     global current_process, active_rtsp_url
#     prepare_hls_directory()
#     threading.Thread(
#         target=rtsp_reader_thread,
#         args=(rtsp_url,),
#         daemon=True
#     ).start()
#     active_rtsp_url = rtsp_url

# def prepare_hls_directory():
#     """Prépare le répertoire HLS sans supprimer les fichiers existants"""
#     try:
#         Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
#         Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
#         playlist_path = os.path.join(HLS_OUTPUT_DIR, "playlist.m3u8")
#         if os.path.exists(playlist_path):
#             timestamp = time.strftime("%Y%m%d-%H%M%S")
#             archive_path = os.path.join(HLS_OUTPUT_DIR, f"playlist_archive_{timestamp}.m3u8")
#             shutil.copy2(playlist_path, archive_path)
#             logger.info(f"Playlist existante archivée sous: {archive_path}")
#         logger.info("Répertoire HLS préparé")
#     except Exception as e:
#         logger.error(f"Erreur lors de la préparation du répertoire HLS: {str(e)}")

# @app.get("/api/start")
# async def start_processing(
#     rtsp_url: str = Query(..., description="URL RTSP à convertir en HLS"),
#     enable_ai: bool = Query(True, description="Activer la détection AI")
# ):
#     """Démarre ou met à jour la conversion RTSP vers HLS avec détection AI"""
#     global restart_event, ai_enabled
#     if not rtsp_url.startswith("rtsp://"):
#         raise HTTPException(status_code=400, detail="URL RTSP invalide")
#     ai_enabled = enable_ai
#     restart_event.set()
#     time.sleep(1)
#     restart_event.clear()
#     try:
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué avant démarrage")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
#     start_hls_conversion_with_detection(rtsp_url)
#     return JSONResponse({
#         "status": "Conversion avec AI intégrée démarrée",
#         "rtsp_url": rtsp_url,
#         "hls_url": f"http://localhost:{HTTP_PORT}/hls/playlist.m3u8",
#         "ai_enabled": ai_enabled
#     })

# @app.get("/api/stop")
# async def stop_processing():
#     """Arrête le processus de conversion et nettoie tous les fichiers"""
#     global restart_event, active_rtsp_url
#     restart_event.set()
#     time.sleep(1)
#     active_rtsp_url = None
#     try:
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
#     return JSONResponse({
#         "status": "Flux HLS arrêté et fichiers supprimés",
#         "segments_directory": HLS_OUTPUT_DIR
#     })

# @app.get("/api/clean")
# async def clean_files():
#     """Nettoie tous les fichiers HLS (segments et playlist) et le dossier analytics"""
#     try:
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
#         return JSONResponse({"status": "Tous les fichiers HLS et analytics ont été supprimés"})
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors du nettoyage",
#             "error": str(e)
#         }, status_code=500)

# @app.get("/api/verify_cleanup")
# async def verify_cleanup():
#     """Vérifie que le dossier HLS a été nettoyé."""
#     try:
#         if os.path.exists(HLS_OUTPUT_DIR):
#             files = [f for f in os.listdir(HLS_OUTPUT_DIR) 
#                     if os.path.isfile(os.path.join(HLS_OUTPUT_DIR, f))]
#             if files:
#                 return JSONResponse({
#                     "status": "Dossier non vide",
#                     "remaining_files": files,
#                     "should_clean": True
#                 }, status_code=400)
#         return JSONResponse({
#             "status": "Dossier propre",
#             "details": "Aucun fichier trouvé dans le dossier HLS"
#         })
#     except Exception as e:
#         logger.error(f"Erreur vérification: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors de la vérification",
#             "error": str(e)
#         }, status_code=500)

# @app.get("/api/status")
# async def get_status():
#     """Retourne le statut actuel avec informations de tracking"""
#     is_active = not restart_event.is_set() and active_rtsp_url is not None
#     playlist_exists = os.path.exists(f"{HLS_OUTPUT_DIR}/playlist.m3u8")
#     ts_segments = [f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')]
#     total_size_bytes = 0
#     for segment in ts_segments:
#         segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
#         total_size_bytes += os.path.getsize(segment_path)
#     total_size_mb = total_size_bytes / (1024 * 1024)
#     annotations_in_segments = False
#     if ai_enabled and os.path.exists(f"{HLS_ANALYTICS_DIR}/annotated_frame.npy"):
#         annotations_in_segments = True
#     tracking_info = {}
#     if ai_enabled:
#         current_time = time.time()
#         tracked_objects_clean = {}
#         for track_id, obj_info in detection_results["tracked_objects"].items():
#             if current_time - obj_info["last_seen"] < 10.0:
#                 tracked_objects_clean[track_id] = {
#                     "class": obj_info["class"],
#                     "duration": round(current_time - obj_info["first_seen"], 1),
#                     "last_seen": round(current_time - obj_info["last_seen"], 1),
#                     "position": obj_info["position"]
#                 }
#         tracking_info["tracked_objects"] = tracked_objects_clean
#         tracking_info["active_tracks"] = len(tracked_objects_clean)
#     return JSONResponse({
#         "active": is_active,
#         "current_rtsp_url": active_rtsp_url,
#         "hls_playlist_exists": playlist_exists,
#         "segment_count": len(ts_segments),
#         "segments": sorted(ts_segments)[:10] + ["..."] if len(ts_segments) > 10 else sorted(ts_segments),
#         "ai_enabled": ai_enabled,
#         "ai_annotations_in_segments": annotations_in_segments,
#         "ai_detection": detection_results if ai_enabled else None,
#         "tracking": tracking_info if ai_enabled else None,
#         "disk_usage_mb": round(total_size_mb, 2)
#     })

# @app.get("/api/analytics/image")
# async def get_latest_detection():
#     """Retourne la dernière image avec détection"""
#     image_path = f"{HLS_ANALYTICS_DIR}/latest_detection.jpg"
#     if os.path.exists(image_path):
#         return FileResponse(image_path)
#     else:
#         raise HTTPException(status_code=404, detail="Image de détection non disponible")

# @app.get("/api/tracking/status")
# async def get_tracking_status():
#     """Retourne l'état détaillé du tracking des objets"""
#     if not ai_enabled:
#         return JSONResponse({
#             "status": "AI désactivée",
#             "tracking_enabled": False
#         })
#     current_time = time.time()
#     tracked_objects_clean = {}
#     for track_id, obj_info in detection_results["tracked_objects"].items():
#         if current_time - obj_info["last_seen"] < 10.0:
#             tracked_objects_clean[track_id] = {
#                 "class": obj_info["class"],
#                 "duration": round(current_time - obj_info["first_seen"], 1),
#                 "last_seen": round(current_time - obj_info["last_seen"], 1),
#                 "position": obj_info["position"]
#             }
#     class_counts = defaultdict(int)
#     for obj_info in tracked_objects_clean.values():
#         class_counts[obj_info["class"]] += 1
#     return JSONResponse({
#         "status": "Tracking actif",
#         "tracking_enabled": True,
#         "active_tracks": len(tracked_objects_clean),
#         "class_distribution": dict(class_counts),
#         "tracked_objects": tracked_objects_clean
#     })

# @app.get("/api/cleanup")
# async def cleanup_segments(
#     keep_last: int = Query(10, description="Nombre de segments récents à conserver (0 pour tout garder)")
# ):
#     """Nettoie les anciens segments tout en préservant les plus récents"""
#     try:
#         ts_segments = sorted([f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')])
#         if keep_last > 0 and len(ts_segments) > keep_last:
#             segments_to_delete = ts_segments[:-keep_last]
#             for segment in segments_to_delete:
#                 segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
#                 os.remove(segment_path)
#             return JSONResponse({
#                 "status": "Nettoyage effectué",
#                 "segments_deleted": len(segments_to_delete),
#                 "segments_kept": min(keep_last, len(ts_segments))
#             })
#         else:
#             return JSONResponse({
#                 "status": "Aucun nettoyage nécessaire",
#                 "segment_count": len(ts_segments)
#             })
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des segments: {str(e)}")
#         return JSONResponse({
#             "status": "Erreur lors du nettoyage",
#             "error": str(e)
#         }, status_code=500)

# @app.on_event("shutdown")
# async def shutdown_event():
#     """Actions à exécuter à l'arrêt de l'application"""
#     logger.info("Arrêt de l'application, nettoyage des fichiers...")
#     try:
#         for file in os.listdir(HLS_OUTPUT_DIR):
#             file_path = os.path.join(HLS_OUTPUT_DIR, file)
#             if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
#                 os.remove(file_path)
#         analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
#         if os.path.exists(analytics_dir):
#             for file in os.listdir(analytics_dir):
#                 file_path = os.path.join(analytics_dir, file)
#                 if os.path.isfile(file_path):
#                     os.remove(file_path)
#         logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
#     except Exception as e:
#         logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")

# app.mount("/hls", StaticFiles(directory=HLS_OUTPUT_DIR), name="hls")

# @app.on_event("startup")
# async def startup_event():
#     """Actions à exécuter au démarrage"""
#     Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
#     Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
#     logger.info("Application démarrée et prête à recevoir des connexions")

# if __name__ == '__main__':
#     import uvicorn
#     uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT, log_level="info")




################################# test 2 #####################################################

import os
import subprocess
import threading
import time
import cv2
import numpy as np
import logging
from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import shutil
import queue
from collections import defaultdict
import signal
import sys
import hashlib

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RTSP to HLS Converter with AI Detection and Tracking")

# Configuration
HLS_OUTPUT_DIR = "tmp/hls_output"
HLS_ANALYTICS_DIR = f"{HLS_OUTPUT_DIR}/analytics"
HTTP_PORT = 8020
PIPE_PATH = "tmp/ffmpeg_pipe.yuv"

# S'assurer que les répertoires existent
Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
Path(os.path.dirname(PIPE_PATH)).mkdir(parents=True, exist_ok=True)

# Charger les modèles YOLO une seule fois au démarrage
try:
    yolo_model = YOLO("yolov8n.pt").to('cuda')
    face_model = YOLO("yolov8n-face.pt").to('cuda')
    logger.info("Modèles YOLO chargés avec succès")
except Exception as e:
    logger.error(f"Erreur lors du chargement des modèles YOLO: {str(e)}")
    yolo_model = None
    face_model = None

# Variables globales
current_process = None
detection_queue = queue.Queue(maxsize=5)  # Réduit pour éviter l'accumulation
process_lock = threading.Lock()
restart_event = threading.Event()
active_rtsp_url = None
ai_enabled = True
detection_results = {
    "objects": {},
    "faces": 0,
    "last_update": None,
    "tracked_objects": {}
}

def signal_handler(sig, frame):
    """Gestionnaire de signal pour l'arrêt propre de l'application"""
    logger.info("Signal d'arrêt reçu, nettoyage en cours...")
    try:
        for file in os.listdir(HLS_OUTPUT_DIR):
            file_path = os.path.join(HLS_OUTPUT_DIR, file)
            if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
                os.remove(file_path)
        analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
        if os.path.exists(analytics_dir):
            for file in os.listdir(analytics_dir):
                file_path = os.path.join(analytics_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

rtsp_transports = ["tcp", "udp", "http", "udp_multicast"]

def draw_boxes_with_tracking(frame, results):
    """Dessine les boîtes de détection avec IDs de tracking sur l'image"""
    annotated_frame = frame.copy()
    if hasattr(results, 'boxes') and results.boxes:
        for box in results.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            class_name = results.names[cls]
            color = (0, 255, 0) if class_name == "person" else (0, 0, 255) if "face" in class_name.lower() else (255, 0, 0)
            track_id = int(box.id[0]) if hasattr(box, 'id') and box.id is not None else None
            if track_id:
                if track_id not in detection_results["tracked_objects"]:
                    detection_results["tracked_objects"][track_id] = {
                        "class": class_name,
                        "first_seen": time.time(),
                        "last_seen": time.time(),
                        "position": (int((x1+x2)/2), int((y1+y2)/2))
                    }
                else:
                    detection_results["tracked_objects"][track_id]["last_seen"] = time.time()
                    detection_results["tracked_objects"][track_id]["position"] = (int((x1+x2)/2), int((y1+y2)/2))
                label = f"{class_name} #{track_id}: {conf:.2f}"
            else:
                label = f"{class_name}: {conf:.2f}"
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            text_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            cv2.rectangle(annotated_frame, (x1, y1 - text_size[1] - 10), (x1 + text_size[0], y1), color, -1)
            cv2.putText(annotated_frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    return annotated_frame

def detection_worker():
    """Thread dédié à l'analyse d'images pour ne pas bloquer le flux vidéo"""
    global detection_results
    logger.info("Démarrage du thread de détection AI")
    last_annotated_hash = None
    while not restart_event.is_set():
        try:
            if detection_queue.empty():
                time.sleep(0.01)
                continue
            frame = detection_queue.get()
            objects_detected = defaultdict(int)
            face_count = 0
            annotated_frame = frame.copy()
            if yolo_model:
                object_results = yolo_model.track(frame, persist=True, tracker="bytetrack.yaml")
                for r in object_results:
                    annotated_frame = draw_boxes_with_tracking(annotated_frame, r)
                    if r.boxes:
                        for box in r.boxes:
                            cls = int(box.cls[0])
                            class_name = r.names[cls]
                            objects_detected[class_name] += 1
            if face_model:
                face_results = face_model.track(frame, persist=True, tracker="bytetrack.yaml")
                for r in face_results:
                    annotated_frame = draw_boxes_with_tracking(annotated_frame, r)
                    if r.boxes:
                        face_count += len(r.boxes)
            detection_results["objects"] = dict(objects_detected)
            detection_results["faces"] = face_count
            detection_results["last_update"] = time.strftime("%Y-%m-%d %H:%M:%S")
            current_time = time.time()
            to_remove = []
            for track_id, obj_info in detection_results["tracked_objects"].items():
                if current_time - obj_info["last_seen"] > 5.0:
                    to_remove.append(track_id)
            for track_id in to_remove:
                del detection_results["tracked_objects"][track_id]
            frame_hash = hashlib.md5(annotated_frame.tobytes()).hexdigest()
            if frame_hash != last_annotated_hash:
                with open(f"{HLS_ANALYTICS_DIR}/annotated_frame.npy", 'wb') as f:
                    np.save(f, annotated_frame)
                last_annotated_hash = frame_hash
        except Exception as e:
            logger.error(f"Erreur dans le thread de détection: {str(e)}")
            time.sleep(0.1)


def update_detection_results(results):
    """Met à jour les résultats de détection globaux"""
    global detection_results
    
    if not results or len(results) == 0:
        return
        
    objects_detected = defaultdict(int)
    face_count = 0
    
    for box in results[0].boxes:
        cls = int(box.cls[0])
        class_name = results[0].names[cls]
        objects_detected[class_name] += 1
        
        if "face" in class_name.lower():
            face_count += 1
    
    detection_results.update({
        "objects": dict(objects_detected),
        "faces": face_count,
        "last_update": time.strftime("%Y-%m-%d %H:%M:%S")
    })

def rtsp_reader_thread(rtsp_url):
    """Thread de lecture RTSP avec gestion correcte de la numérotation des segments"""
    global detection_results
    
    cv2.setNumThreads(2)
    os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp|buffer_size;1024000"
    
    cap = None
    ffmpeg_process = None
    frame_skip_counter = 0
    last_fps_log = time.time()
    processed_frames = 0
    
    # Nettoyer le répertoire avant de commencer pour garantir une numérotation propre
    prepare_hls_directory()
    
    while not restart_event.is_set():
        try:
            cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FPS, 30)
            
            if not cap.isOpened():
                raise RuntimeError(f"Échec d'ouverture du flux RTSP: {rtsp_url}")
                
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            
            # En cas de redémarrage, nettoyer à nouveau pour garantir la propreté de la numérotation
            if ffmpeg_process is not None:
                prepare_hls_directory()
            
            ffmpeg_process = subprocess.Popen(
                configure_ffmpeg(width, height, fps),
                stdin=subprocess.PIPE,
                bufsize=10**8
            )
            
            # Boucle principale optimisée
            while not restart_event.is_set() and cap.isOpened():
                start_time = time.time()
                
                # Lecture frame avec timeout
                ret, frame = cap.read()
                if not ret:
                    frame_skip_counter += 1
                    if frame_skip_counter > 30:
                        logger.warning("Trop de frames manquées, reconnexion...")
                        break
                    time.sleep(0.01)
                    continue
                
                frame_skip_counter = 0
                processed_frames += 1
                
                # Traitement temps-réel avec priorité fluidité
                display_frame = frame.copy()
                if ai_enabled and processed_frames % 2 == 0:  # Traiter 1 frame sur 2
                    try:
                        # Détection IA légère
                        results = yolo_model.track(
                            frame, 
                            persist=True, 
                            verbose=False,
                            imgsz=320,  # Résolution réduite
                            half=True    # float16 si GPU
                        )
                        
                        update_detection_results(results)
                        display_frame = draw_boxes_with_tracking(frame, results[0])
                    except Exception as e:
                        logger.error(f"Erreur IA: {str(e)}")
                
                # Envoi à FFmpeg
                try:
                    ffmpeg_process.stdin.write(display_frame.tobytes())
                except BrokenPipeError:
                    logger.error("FFmpeg pipe broken, redémarrage...")
                    break
                
                # Log des performances
                if time.time() - last_fps_log > 5.0:
                    current_fps = processed_frames / (time.time() - last_fps_log)
                    logger.info(f"FPS: {current_fps:.1f} | Latence: {(time.time() - start_time)*1000:.1f}ms")
                    processed_frames = 0
                    last_fps_log = time.time()
                
        except Exception as e:
            logger.error(f"Erreur dans le thread RTSP: {str(e)}")
            time.sleep(2)
            
        finally:
            # Nettoyage
            if cap:
                cap.release()
            if ffmpeg_process:
                ffmpeg_process.stdin.close()
                ffmpeg_process.terminate()
            
            if not restart_event.is_set():
                time.sleep(1)

def configure_ffmpeg(width, height, fps):
    """Configuration ultra-optimisée de FFmpeg pour faible latence avec numérotation séquentielle garantie"""
    return [
        "ffmpeg",
        "-loglevel", "error",
        "-threads", "4",
        "-fflags", "nobuffer",
        "-flags", "low_delay",
        "-strict", "experimental",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-pix_fmt", "bgr24",
        "-s", f"{width}x{height}",
        "-r", str(fps),
        "-i", "-",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "zerolatency",
        "-x264-params", "keyint=15:no-scenecut=1",
        "-bf", "0",
        "-pix_fmt", "yuv420p",
        "-f", "hls",
        "-hls_time", "0.5",
        "-hls_flags", "independent_segments+append_list",  # Ajout de append_list
        "-hls_list_size", "0",
        "-hls_segment_filename", f"{HLS_OUTPUT_DIR}/segment%d.ts",  # Format strict pour les segments
        "-hls_segment_type", "mpegts",  # Type explicite
        "-start_number", "1",  # Commencer la numérotation à 1 de façon explicite
        "-hls_allow_cache", "0",  # Désactiver le cache pour éviter les problèmes de numérotation
        f"{HLS_OUTPUT_DIR}/playlist.m3u8"
    ]

def start_hls_conversion_with_detection(rtsp_url):
    """Démarre la conversion RTSP vers HLS avec détection AI intégrée"""
    global current_process, active_rtsp_url
    prepare_hls_directory()
    threading.Thread(
        target=rtsp_reader_thread,
        args=(rtsp_url,),
        daemon=True
    ).start()
    active_rtsp_url = rtsp_url

def prepare_hls_directory():
    """Prépare le répertoire HLS en supprimant les segments existants"""
    try:
        Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
        Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
        
        # Supprimer tous les segments et playlists existants
        for file in os.listdir(HLS_OUTPUT_DIR):
            file_path = os.path.join(HLS_OUTPUT_DIR, file)
            if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
                os.remove(file_path)
        
        logger.info("Répertoire HLS nettoyé et préparé pour une nouvelle session")
    except Exception as e:
        logger.error(f"Erreur lors de la préparation du répertoire HLS: {str(e)}")

@app.get("/api/start")
async def start_processing(
    rtsp_url: str = Query(..., description="URL RTSP à convertir en HLS"),
    enable_ai: bool = Query(True, description="Activer la détection AI")
):
    """Démarre ou met à jour la conversion RTSP vers HLS avec détection AI"""
    global restart_event, ai_enabled
    if not rtsp_url.startswith("rtsp://"):
        raise HTTPException(status_code=400, detail="URL RTSP invalide")
    ai_enabled = enable_ai
    restart_event.set()
    time.sleep(1)
    restart_event.clear()
    try:
        for file in os.listdir(HLS_OUTPUT_DIR):
            file_path = os.path.join(HLS_OUTPUT_DIR, file)
            if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
                os.remove(file_path)
        analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
        if os.path.exists(analytics_dir):
            for file in os.listdir(analytics_dir):
                file_path = os.path.join(analytics_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué avant démarrage")
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
    start_hls_conversion_with_detection(rtsp_url)
    return JSONResponse({
        "status": "Conversion avec AI intégrée démarrée",
        "rtsp_url": rtsp_url,
        "hls_url": f"http://localhost:{HTTP_PORT}/hls/playlist.m3u8",
        "ai_enabled": ai_enabled
    })

@app.get("/api/stop")
async def stop_processing():
    """Arrête le processus de conversion et nettoie tous les fichiers"""
    global restart_event, active_rtsp_url
    restart_event.set()
    time.sleep(1)
    active_rtsp_url = None
    try:
        for file in os.listdir(HLS_OUTPUT_DIR):
            file_path = os.path.join(HLS_OUTPUT_DIR, file)
            if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
                os.remove(file_path)
        analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
        if os.path.exists(analytics_dir):
            for file in os.listdir(analytics_dir):
                file_path = os.path.join(analytics_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
    return JSONResponse({
        "status": "Flux HLS arrêté et fichiers supprimés",
        "segments_directory": HLS_OUTPUT_DIR
    })

@app.get("/api/clean")
async def clean_files():
    """Nettoie tous les fichiers HLS (segments et playlist) et le dossier analytics"""
    try:
        for file in os.listdir(HLS_OUTPUT_DIR):
            file_path = os.path.join(HLS_OUTPUT_DIR, file)
            if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
                os.remove(file_path)
        analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
        if os.path.exists(analytics_dir):
            for file in os.listdir(analytics_dir):
                file_path = os.path.join(analytics_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
        return JSONResponse({"status": "Tous les fichiers HLS et analytics ont été supprimés"})
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")
        return JSONResponse({
            "status": "Erreur lors du nettoyage",
            "error": str(e)
        }, status_code=500)

@app.get("/api/verify_cleanup")
async def verify_cleanup():
    """Vérifie que le dossier HLS a été nettoyé."""
    try:
        if os.path.exists(HLS_OUTPUT_DIR):
            files = [f for f in os.listdir(HLS_OUTPUT_DIR) 
                    if os.path.isfile(os.path.join(HLS_OUTPUT_DIR, f))]
            if files:
                return JSONResponse({
                    "status": "Dossier non vide",
                    "remaining_files": files,
                    "should_clean": True
                }, status_code=400)
        return JSONResponse({
            "status": "Dossier propre",
            "details": "Aucun fichier trouvé dans le dossier HLS"
        })
    except Exception as e:
        logger.error(f"Erreur vérification: {str(e)}")
        return JSONResponse({
            "status": "Erreur lors de la vérification",
            "error": str(e)
        }, status_code=500)

@app.get("/api/status")
async def get_status():
    """Retourne le statut actuel avec informations de tracking"""
    is_active = not restart_event.is_set() and active_rtsp_url is not None
    playlist_exists = os.path.exists(f"{HLS_OUTPUT_DIR}/playlist.m3u8")
    ts_segments = [f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')]
    total_size_bytes = 0
    for segment in ts_segments:
        segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
        total_size_bytes += os.path.getsize(segment_path)
    total_size_mb = total_size_bytes / (1024 * 1024)
    annotations_in_segments = False
    if ai_enabled and os.path.exists(f"{HLS_ANALYTICS_DIR}/annotated_frame.npy"):
        annotations_in_segments = True
    tracking_info = {}
    if ai_enabled:
        current_time = time.time()
        tracked_objects_clean = {}
        for track_id, obj_info in detection_results["tracked_objects"].items():
            if current_time - obj_info["last_seen"] < 10.0:
                tracked_objects_clean[track_id] = {
                    "class": obj_info["class"],
                    "duration": round(current_time - obj_info["first_seen"], 1),
                    "last_seen": round(current_time - obj_info["last_seen"], 1),
                    "position": obj_info["position"]
                }
        tracking_info["tracked_objects"] = tracked_objects_clean
        tracking_info["active_tracks"] = len(tracked_objects_clean)
    return JSONResponse({
        "active": is_active,
        "current_rtsp_url": active_rtsp_url,
        "hls_playlist_exists": playlist_exists,
        "segment_count": len(ts_segments),
        "segments": sorted(ts_segments)[:10] + ["..."] if len(ts_segments) > 10 else sorted(ts_segments),
        "ai_enabled": ai_enabled,
        "ai_annotations_in_segments": annotations_in_segments,
        "ai_detection": detection_results if ai_enabled else None,
        "tracking": tracking_info if ai_enabled else None,
        "disk_usage_mb": round(total_size_mb, 2)
    })

@app.get("/api/analytics/image")
async def get_latest_detection():
    """Retourne la dernière image avec détection"""
    image_path = f"{HLS_ANALYTICS_DIR}/latest_detection.jpg"
    if os.path.exists(image_path):
        return FileResponse(image_path)
    else:
        raise HTTPException(status_code=404, detail="Image de détection non disponible")

@app.get("/api/tracking/status")
async def get_tracking_status():
    """Retourne l'état détaillé du tracking des objets"""
    if not ai_enabled:
        return JSONResponse({
            "status": "AI désactivée",
            "tracking_enabled": False
        })
    current_time = time.time()
    tracked_objects_clean = {}
    for track_id, obj_info in detection_results["tracked_objects"].items():
        if current_time - obj_info["last_seen"] < 10.0:
            tracked_objects_clean[track_id] = {
                "class": obj_info["class"],
                "duration": round(current_time - obj_info["first_seen"], 1),
                "last_seen": round(current_time - obj_info["last_seen"], 1),
                "position": obj_info["position"]
            }
    class_counts = defaultdict(int)
    for obj_info in tracked_objects_clean.values():
        class_counts[obj_info["class"]] += 1
    return JSONResponse({
        "status": "Tracking actif",
        "tracking_enabled": True,
        "active_tracks": len(tracked_objects_clean),
        "class_distribution": dict(class_counts),
        "tracked_objects": tracked_objects_clean
    })

@app.get("/api/cleanup")
async def cleanup_segments(
    keep_last: int = Query(10, description="Nombre de segments récents à conserver (0 pour tout garder)")
):
    """Nettoie les anciens segments tout en préservant les plus récents"""
    try:
        ts_segments = sorted([f for f in os.listdir(HLS_OUTPUT_DIR) if f.endswith('.ts')])
        if keep_last > 0 and len(ts_segments) > keep_last:
            segments_to_delete = ts_segments[:-keep_last]
            for segment in segments_to_delete:
                segment_path = os.path.join(HLS_OUTPUT_DIR, segment)
                os.remove(segment_path)
            return JSONResponse({
                "status": "Nettoyage effectué",
                "segments_deleted": len(segments_to_delete),
                "segments_kept": min(keep_last, len(ts_segments))
            })
        else:
            return JSONResponse({
                "status": "Aucun nettoyage nécessaire",
                "segment_count": len(ts_segments)
            })
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des segments: {str(e)}")
        return JSONResponse({
            "status": "Erreur lors du nettoyage",
            "error": str(e)
        }, status_code=500)

@app.on_event("shutdown")
async def shutdown_event():
    """Actions à exécuter à l'arrêt de l'application"""
    logger.info("Arrêt de l'application, nettoyage des fichiers...")
    try:
        for file in os.listdir(HLS_OUTPUT_DIR):
            file_path = os.path.join(HLS_OUTPUT_DIR, file)
            if os.path.isfile(file_path) and (file.endswith('.ts') or file.endswith('.m3u8')):
                os.remove(file_path)
        analytics_dir = os.path.join(HLS_OUTPUT_DIR, "analytics")
        if os.path.exists(analytics_dir):
            for file in os.listdir(analytics_dir):
                file_path = os.path.join(analytics_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        logger.info("Nettoyage des fichiers HLS et du dossier analytics effectué")
    except Exception as e:
        logger.error(f"Erreur lors du nettoyage des fichiers: {str(e)}")

app.mount("/hls", StaticFiles(directory=HLS_OUTPUT_DIR), name="hls")

@app.on_event("startup")
async def startup_event():
    """Actions à exécuter au démarrage"""
    Path(HLS_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    Path(HLS_ANALYTICS_DIR).mkdir(parents=True, exist_ok=True)
    logger.info("Application démarrée et prête à recevoir des connexions")

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=HTTP_PORT, log_level="info")




