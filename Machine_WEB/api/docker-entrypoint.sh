#!/bin/sh

# Créer le répertoire pour les streams s'il n'existe pas
mkdir -p /usr/src/app/streams/hls

# Démarrer l'application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload