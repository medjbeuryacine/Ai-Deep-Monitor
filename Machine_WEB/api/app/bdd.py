import sqlite3
from datetime import datetime

def create_database(db_path):
    """
    Create the SQLite database with all required tables for the Personnes Management system
    """
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create tables
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Historique_Cam (
            id_hist_cam INTEGER PRIMARY KEY AUTOINCREMENT,
            date_modif DATE NOT NULL,
            champ_modifie TEXT NOT NULL
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Caracteristique_Camera (
            id_caracteristique INTEGER PRIMARY KEY AUTOINCREMENT,
            marque TEXT NOT NULL,
            modele TEXT NOT NULL,
            mode_vision TEXT NOT NULL,
            image_par_sec INTEGER NOT NULL,
            codec_video TEXT DEFAULT 'H.264'
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Camera (
            id_cam INTEGER PRIMARY KEY AUTOINCREMENT,
            IP TEXT NOT NULL,
            login TEXT NOT NULL,
            mdp TEXT NOT NULL,
            nom_cam TEXT NOT NULL,
            emplacement TEXT NOT NULL,
            adresse_MAC TEXT NOT NULL,
            adresse_flux_principal TEXT NOT NULL,
            flux_principal_active BOOLEAN DEFAULT TRUE,
            adresse_flux_secondaire TEXT,
            flux_secondaire_active BOOLEAN DEFAULT FALSE,
            adresse_flux_tertiaire TEXT,
            flux_tertiaire_active BOOLEAN DEFAULT FALSE,
            port_video INTEGER DEFAULT 554,
            is_active BOOLEAN DEFAULT TRUE,
            id_hist_cam INTEGER NOT NULL,
            id_caracteristique INTEGER NOT NULL,
            FOREIGN KEY (id_hist_cam) REFERENCES Historique_Cam(id_hist_cam),
            FOREIGN KEY (id_caracteristique) REFERENCES Caracteristique_Camera(id_caracteristique)
        )
        ''')

        # 2. Tables de gestion des personnes
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Historique_Personne (
            id_hist_pers INTEGER PRIMARY KEY AUTOINCREMENT,
            date_modif DATE NOT NULL,
            champ_modifie TEXT NOT NULL
        )
        ''')

     
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Personne (
            id_personne INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            sexe TEXT NOT NULL,
            role TEXT NOT NULL,
            niveau_autorisation TEXT NOT NULL,
            autorisation TEXT NOT NULL DEFAULT 'Non',
            zones_acces TEXT NOT NULL,
            date_naissance DATE NOT NULL,
            plage_horaire_debut TIME,
            plage_horaire_fin TIME,
            badge_actif BOOLEAN DEFAULT 0,
            jours_acces TEXT DEFAULT NULL,  -- Jours séparés par virgules (ex: "Lundi,Mercredi")
            limite_acces_jours BOOLEAN DEFAULT 0,  -- 0=illimité, 1=limite aux jours spécifiés
            id_hist_pers INTEGER NOT NULL,
            FOREIGN KEY (id_hist_pers) REFERENCES Historique_Personne(id_hist_pers)
        )
        ''')

        # 3. Tables de modèles IA
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Modele_IA (
            id_modele INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL UNIQUE,
            type TEXT CHECK(type IN ('Visage', 'Personne', 'Anomalie', 'Objet')) NOT NULL,
            version TEXT NOT NULL,
            chemin_modele TEXT NOT NULL,
            date_entrainement DATE NOT NULL,
            precision REAL CHECK(precision >= 0 AND precision <= 100),
            seuil_confiance REAL DEFAULT 0.7,
            is_active BOOLEAN DEFAULT TRUE
        )
        ''')

        # 4. Tables de détections IA
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Detection (
            id_detection INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME NOT NULL,
            type_detection TEXT CHECK(type_detection IN ('Visage', 'Personne', 'Anomalie', 'Objet')) NOT NULL,
            confiance REAL CHECK(confiance >= 0 AND confiance <= 1),
            coordonnees TEXT,  -- Format JSON: {"x1": 0.1, "y1": 0.2, "x2": 0.3, "y2": 0.4}
            id_modele INTEGER NOT NULL,
            FOREIGN KEY (id_modele) REFERENCES Modele_IA(id_modele)
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Detection_Visage (
            id_visage INTEGER PRIMARY KEY AUTOINCREMENT,
            visage_reconnu BOOLEAN NOT NULL,
            id_personne INTEGER,
            embeddings BLOB,  -- Stockage des embeddings faciaux
            FOREIGN KEY (id_personne) REFERENCES Personne(id_personne),
            FOREIGN KEY (id_visage) REFERENCES Detection(id_detection)
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Detection_Personne (
            id_personne_detectee INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_personnes INTEGER DEFAULT 1,
            FOREIGN KEY (id_personne_detectee) REFERENCES Detection(id_detection)
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Detection_Anomalie (
            id_anomalie INTEGER PRIMARY KEY,
            nom_anomalie TEXT NOT NULL,
            niveau_alerte INTEGER CHECK(niveau_alerte BETWEEN 1 AND 5),
            description TEXT,
            FOREIGN KEY (id_anomalie) REFERENCES Detection(id_detection)
        )
        ''')

        # 5. Tables de relation entre caméras et détections
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Camera_Detection (
            id_cam INTEGER NOT NULL ,
            id_detection INTEGER NOT NULL,
            PRIMARY KEY (id_cam, id_detection),
            FOREIGN KEY (id_cam) REFERENCES Camera(id_cam),
            FOREIGN KEY (id_detection) REFERENCES Detection(id_detection)
        )
        ''')

        # 6. Tables de configuration des modèles
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Configuration_IA (
            id_config INTEGER PRIMARY KEY AUTOINCREMENT,
            id_cam INTEGER NOT NULL,
            id_modele_visage INTEGER,
            id_modele_personne INTEGER,
            id_modele_anomalie INTEGER,
            seuil_visage REAL DEFAULT 0.7,
            seuil_personne REAL DEFAULT 0.6,
            seuil_anomalie REAL DEFAULT 0.5,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (id_cam) REFERENCES Camera(id_cam),
            FOREIGN KEY (id_modele_visage) REFERENCES Modele_IA(id_modele),
            FOREIGN KEY (id_modele_personne) REFERENCES Modele_IA(id_modele),
            FOREIGN KEY (id_modele_anomalie) REFERENCES Modele_IA(id_modele)
        )
        ''')

        # 7. Tables de logs et statistiques
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Logs_IA (
            id_log INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME NOT NULL,
            type_evenement TEXT NOT NULL,
            description TEXT NOT NULL,
            id_cam INTEGER,
            id_modele INTEGER,
            FOREIGN KEY (id_cam) REFERENCES Camera(id_cam),
            FOREIGN KEY (id_modele) REFERENCES Modele_IA(id_modele)
        )
        ''')

        cursor.execute('''
        CREATE TABLE IF NOT EXISTS Statistiques_Detection (
            id_stat INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            type_detection TEXT NOT NULL,
            nombre_detections INTEGER DEFAULT 0,
            taux_reussite REAL,
            id_modele INTEGER NOT NULL,
            FOREIGN KEY (id_modele) REFERENCES Modele_IA(id_modele)
        )
        ''')

        conn.commit()
        print(f"Base de données créée avec succès : {db_path}")

    except sqlite3.Error as e:
        print(f"Erreur lors de la création de la base de données : {e}")
    finally:
        if conn:
            conn.close()

def insert_initial_data(db_path):
    """
    Insert some initial data into the database for testing
    """
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Insert initial data
        cursor.execute('''
        INSERT INTO Historique_Personne (date_modif, champ_modifie) 
        VALUES (?, ?)
        ''', (datetime.now().date(), 'Initial Creation'))
        id_hist_pers = cursor.lastrowid

        cursor.execute('''
        INSERT INTO Historique_Cam (date_modif, champ_modifie) 
        VALUES (?, ?)
        ''', (datetime.now().date(), 'Initial Creation'))
        id_hist_cam = cursor.lastrowid

        cursor.execute('''
        INSERT INTO Caracteristique_Camera 
        (marque, modele, mode_vision, image_par_sec, codec_video) 
        VALUES (?, ?, ?, ?, ?)
        ''', ('VACITEX', 'X-500', 'Jour/Nuit', 30, 'H.265'))
        id_caracteristique = cursor.lastrowid

        cursor.execute('''
        INSERT INTO Camera 
        (IP, login, mdp, nom_cam, emplacement, adresse_MAC, 
         adresse_flux_principal, adresse_flux_secondaire, adresse_flux_tertiaire,
         port_video, is_active, id_hist_cam, id_caracteristique) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            '192.168.1.100', 
            'admin', 
            'password123', 
            'Caméra Entrée', 
            'Porte Principale', 
            '00:1A:2B:3C:4D:5E',
            'rtsp://192.168.1.100:554/stream1',
            'rtsp://192.168.1.100:554/stream2',
            'rtsp://192.168.1.100:554/stream3',
            554,
            True,
            id_hist_cam,
            id_caracteristique
        ))

        # Inserting a model
        cursor.execute('''
        INSERT INTO Modele_IA
        (nom, type, version, chemin_modele, date_entrainement, precision, seuil_confiance, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'FaceRecognition', 'Visage', '1.0', '/models/face_model_v1.pt', 
            datetime.now().date(), 95.5, 0.75, True
        ))
        id_modele = cursor.lastrowid

        # Inserting a detection
        cursor.execute('''
        INSERT INTO Detection
        (timestamp, type_detection, confiance, coordonnees, id_modele)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            datetime.now(), 'Visage', 0.92, 
            '{"x1": 0.2, "y1": 0.3, "x2": 0.4, "y2": 0.5}',
            id_modele
        ))
        id_detection = cursor.lastrowid

        # Inserting face detection
        cursor.execute('''
        INSERT INTO Detection_Visage
        (id_visage, visage_reconnu)
        VALUES (?, ?)
        ''', (id_detection, True))
        
        # Inserting persons without referencing non-existent id_visage
        cursor.execute('''
        INSERT INTO Personne 
        (nom, prenom, sexe, role, niveau_autorisation, autorisation, zones_acces, 
        date_naissance, plage_horaire_debut, plage_horaire_fin, 
        badge_actif, jours_acces, limite_acces_jours, id_hist_pers) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'Dupont', 'Jean', 'Homme', 'Administrateur', 
            'Admin', 'Oui', 'Salle Serveurs Principaux,Salle de Contrôle', 
            '1980-01-01', '08:00', '18:00', 
            1, 'Lundi,Mardi,Jeudi', 1,
            id_hist_pers
        ))

        # Ajout d'un second exemple avec accès illimité
        cursor.execute('''
        INSERT INTO Personne 
        (nom, prenom, sexe, role, niveau_autorisation, autorisation, zones_acces, 
        date_naissance, plage_horaire_debut, plage_horaire_fin, 
        badge_actif, jours_acces, limite_acces_jours, id_hist_pers) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            'Martin', 'Sophie', 'Femme', 'Technicien', 
            'Avancé', 'Oui', 'Salle Technique', 
            '1990-05-15', '09:00', '17:00', 
            1, None, 0,
            id_hist_pers
        ))

        conn.commit()
        print("Initial data inserted successfully")

    except sqlite3.Error as e:
        print(f"An error occurred while inserting data: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    DATABASE_PATH = 'data_center_management.db'
    create_database(DATABASE_PATH)
    insert_initial_data(DATABASE_PATH)