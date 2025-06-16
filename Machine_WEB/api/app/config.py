# app/config.py
from dotenv import load_dotenv
import os

# Charger les variables d'environnement du fichier .env
load_dotenv()

# Charger les configurations sensibles
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME")
}