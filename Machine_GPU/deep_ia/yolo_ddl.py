import os
import urllib.request
import subprocess
import torch
from ultralytics import YOLO

# 📂 Définition des chemins des modèles
MODELS_DIR = os.path.expanduser("~/deep_ia/models")
YOLOV8_MODEL = os.path.join(MODELS_DIR, "yolov8n.pt")
YOLOV8_ONNX = os.path.join(MODELS_DIR, "yolov8n/1/model.onnx")
YOLOV8_CONFIG = os.path.join(MODELS_DIR, "yolov8n/config.pbtxt")

# 📥 Téléchargement de YOLOv8 si absent
YOLOV8_URL = "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolov8n.pt"

def download_model(url, output_path):
    """Télécharge un modèle si absent"""
    if not os.path.exists(output_path):
        print(f"📥 Téléchargement de {output_path}...")
        urllib.request.urlretrieve(url, output_path)
        print(f"✅ {output_path} téléchargé avec succès.")
    else:
        print(f"ℹ️ {output_path} déjà présent.")

# 🔽 Télécharger YOLOv8
download_model(YOLOV8_URL, YOLOV8_MODEL)

# 🚀 Conversion YOLOv8 en ONNX
def export_yolov8_to_onnx(pt_model, onnx_output):
    """Convertit un modèle YOLOv8 en ONNX"""
    print(f"🚀 Exportation de {pt_model} en ONNX...")

    model = YOLO(pt_model)
    model.export(format="onnx", opset=9, dynamic=True)

    os.rename(pt_model.replace(".pt", ".onnx"), onnx_output)
    print(f"✅ Modèle exporté en ONNX : {onnx_output}")

# 📂 Créer les dossiers pour Triton
os.makedirs(os.path.dirname(YOLOV8_ONNX), exist_ok=True)

# 🛠 Exporter YOLOv8 en ONNX
export_yolov8_to_onnx(YOLOV8_MODEL, YOLOV8_ONNX)

# 🛠 Génération du fichier `config.pbtxt` pour YOLOv8
config_yolov8 = f"""
name: "yolov8n"
platform: "onnxruntime"
max_batch_size: 4
input [
  {{
    name: "images"
    data_type: TYPE_FP32
    dims: [-1, 3, 640, 640]
  }}
]
output [
  {{
    name: "output0"
    data_type: TYPE_FP32
    dims: [-1, 84, -1]
  }}
]
"""

# ✍️ Écriture du fichier `config.pbtxt`
with open(YOLOV8_CONFIG, "w") as f:
    f.write(config_yolov8.strip())
print(f"✅ Configuration Triton générée : {YOLOV8_CONFIG}")

# 🚀 Démarrage de Triton avec YOLOv8
print("🚀 Démarrage de Triton Inference Server...")
subprocess.run([
    "sudo", "docker", "run", "--rm", "--gpus", "all",
    "-p", "8000:8000", "-p", "8001:8001", "-p", "8002:8002",
    "-v", f"{MODELS_DIR}:/models",
    "nvcr.io/nvidia/tritonserver:24.04-py3",
    "tritonserver", "--model-repository=/models"
])
