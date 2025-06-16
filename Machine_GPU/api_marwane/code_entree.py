import os, cv2, json
import numpy as np
from collections import defaultdict
from ultralytics import YOLO
import sys
sys.path.append("/home/deep01/api_marwane/ByteTrack")
from yolox.tracker.byte_tracker import BYTETracker
import argparse
import torch

# === Détection device GPU/CPU ===
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print(f"[INFO] YOLO device: {device}")

# === YOLO + ByteTrack ===
if not os.path.exists("yolov8s.pt"):
    raise FileNotFoundError("Le fichier yolov8s.pt est introuvable dans le dossier courant !")

model = YOLO("yolov8s.pt")
model.to(device)

args = argparse.Namespace(
    track_thresh=0.5,
    track_buffer=30,
    match_thresh=0.8,
    aspect_ratio_thresh=1.6,
    min_box_area=10,
    mot20=False,
    frame_rate=30
)
tracker = BYTETracker(args)

# === Zones et chemins ===
zone_entree = np.array([[100, 200], [520, 200], [600, 380], [40, 380]])
json_path = "compteur.json"

# === Fonctions JSON ===
def read_json():
    if os.path.exists(json_path):
        with open(json_path) as f:
            return json.load(f)
    return {"entrances": 0, "sorties": 0, "current_inside": 0}

def update_json(compteur):
    with open(json_path, "w") as f:
        json.dump(compteur, f, indent=4)

# === Générateur de flux ===
def generate_entree_stream(video_source="video_passage/camera_entree_lumi_normal.mp4"):
    cap = cv2.VideoCapture(video_source)
    track_history = defaultdict(list)
    already_counted = set()

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        compteur = read_json()

        results = model.track(frame, classes=[0], persist=True, conf=0.3)
        if results and hasattr(results[0], 'boxes') and results[0].boxes.id is not None:
            for box in results[0].boxes:
                track_id = int(box.id.item())
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cx = (x1 + x2) // 2
                top_point = (cx, y1)

                track_history[track_id].append(top_point)

                if len(track_history[track_id]) >= 2 and track_id not in already_counted:
                    y_prev = track_history[track_id][-2][1]
                    y_now = track_history[track_id][-1][1]
                    was_out = cv2.pointPolygonTest(zone_entree, (cx, y_prev), False) < 0
                    is_in = cv2.pointPolygonTest(zone_entree, top_point, False) >= 0

                    if was_out and is_in and y_now > y_prev:
                        already_counted.add(track_id)
                        compteur["entrances"] += 1
                        compteur["current_inside"] += 1
                        update_json(compteur)

                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.circle(frame, top_point, 4, (255, 0, 0), -1)

        # Zone et textes
        cv2.polylines(frame, [zone_entree], True, (255, 0, 0), 2)
        # cv2.putText(frame, f"Entrées: {compteur['entrances']}", (10, 30),
        #             cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        # cv2.putText(frame, f"Dans la salle: {compteur['current_inside']}", (10, 70),
        #             cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        _, jpeg = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

    cap.release()
