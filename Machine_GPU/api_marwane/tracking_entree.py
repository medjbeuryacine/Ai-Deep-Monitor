from ultralytics import YOLO
import cv2
from datetime import datetime
import json
import os

model = YOLO('yolov8s-pose.pt')
ligne_y_ratio = 0.8

entree_ids = set()
trajectoires = {}
dernier_y_par_id = {}
ids_actifs = set()

passages_data = {
    "entrees": []
}

def lire_compteur():
    try:
        with open("compteur.json", "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"entrances": 0, "sorties": 0, "current_inside": 0}

def mettre_a_jour_compteur():
    compteur = lire_compteur()
    compteur["entrances"] += 1
    compteur["current_inside"] += 1
    with open("compteur.json", "w") as f:
        json.dump(compteur, f, indent=4)
    return compteur

def generate_frames_entree():
    results = model.track(
        source="video_passage/camera_entree_lumi_normal.mp4",
        stream=True,
        persist=True,
        tracker="botsort.yaml",
        conf=0.5,
        classes=[0],
    )

    global entree_ids, trajectoires, dernier_y_par_id, ids_actifs

    for result in results:
        frame = result.orig_img
        frame_height, frame_width = frame.shape[:2]
        y_line = int(frame_height * ligne_y_ratio)

        ids_actifs_actuels = set()

        if result.boxes.id is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            ids = result.boxes.id.cpu().numpy().astype(int)

            for box, id in zip(boxes, ids):
                ids_actifs_actuels.add(id)
                x1, y1, x2, y2 = box
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)

                if id not in trajectoires:
                    trajectoires[id] = []
                trajectoires[id].append((cx, cy))
                if len(trajectoires[id]) > 30:
                    trajectoires[id] = trajectoires[id][-30:]

                for i in range(1, len(trajectoires[id])):
                    cv2.line(frame, trajectoires[id][i - 1], trajectoires[id][i], (255, 0, 0), 2)

                cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                cv2.putText(frame, f"ID {id}", (int(x1), int(y1) - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

                if id not in dernier_y_par_id:
                    dernier_y_par_id[id] = cy

                if dernier_y_par_id[id] < y_line and cy >= y_line and id not in entree_ids:
                    entree_ids.add(id)
                    timestamp = datetime.now().isoformat()
                    passages_data["entrees"].append({"id": int(id), "timestamp": timestamp})
                    print(f"Entrée (haut -> bas) : ID {id} à {timestamp}")
                    mettre_a_jour_compteur()

                dernier_y_par_id[id] = cy

        ids_disparus = ids_actifs - ids_actifs_actuels
        for id_disparu in ids_disparus:
            if id_disparu in trajectoires and id_disparu not in entree_ids:
                if len(trajectoires[id_disparu]) >= 3:
                    points = trajectoires[id_disparu]
                    nb_points_analyse = min(5, len(points))
                    derniers_points = points[-nb_points_analyse:]
                    mouvements_bas = sum(
                        1 for i in range(1, len(derniers_points))
                        if derniers_points[i][1] > derniers_points[i - 1][1]
                    )
                    if mouvements_bas > (len(derniers_points) - 1) / 2:
                        entree_ids.add(id_disparu)
                        timestamp = datetime.now().isoformat()
                        passages_data["entrees"].append({"id": int(id_disparu), "timestamp": timestamp, "type": "disparition_bas"})
                        print(f"Entrée (disparition + trajectoire bas) : ID {id_disparu} à {timestamp}")
                        mettre_a_jour_compteur()

        ids_actifs = ids_actifs_actuels
        compteur = lire_compteur()

        # cv2.line(frame, (0, y_line), (frame_width, y_line), (0, 0, 255), 2)
        # cv2.putText(frame, f"Entrées : {len(entree_ids)}", (10, 30),
        #             cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
        # cv2.putText(frame, f"Présentes : {compteur['current_inside']}", (10, 70),
        #             cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        with open("passages_entree.json", "w") as f:
            json.dump(passages_data, f, indent=4)

        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
