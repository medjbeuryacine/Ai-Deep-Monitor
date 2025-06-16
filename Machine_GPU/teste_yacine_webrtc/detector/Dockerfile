FROM nvidia/cuda:11.7.1-cudnn8-runtime-ubuntu20.04

# Désactive toute interaction (pour tzdata notamment)
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# 1. Installer tzdata, Python, curl, ffmpeg, watchgod (pour --reload)
COPY requirements.txt ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       tzdata python3-pip curl ffmpeg \
    # Configure non-interactive timezone (UTC)
    && ln -fs /usr/share/zoneinfo/Etc/UTC /etc/localtime \
    && dpkg-reconfigure --frontend noninteractive tzdata \
    # Installe les dépendances Python en une passe
    && pip3 install --no-cache-dir -r requirements.txt watchgod \
    # Nettoyage
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Télécharger les poids YOLOv8-Face (lindevs)
RUN mkdir -p /app/models && \
    curl -L https://github.com/lindevs/yolov8-face/releases/latest/download/yolov8n-face-lindevs.pt \
         -o /app/models/yolov8n-face-lindevs.pt

# 3. Copier le code de l'application
COPY app/ ./app

# 4. Démarrer Uvicorn en mode reload pour le dev
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
