# app/db.py
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

# Charger les variables d'environnement du fichier .env
load_dotenv()

# Obtenir les informations de connexion depuis les variables d'environnement
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

def get_db():
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,        # Utilisation de la variable d'environnement
            user=DB_USER,        # Utilisation de la variable d'environnement
            password=DB_PASSWORD, # Utilisation de la variable d'environnement
            database=DB_NAME      # Utilisation de la variable d'environnement
        )
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Erreur lors de la connexion à la base de données: {e}")
        return None

