# AI-Deep Monitor

## 📋 Description

AI-Deep Monitor est une application web de surveillance vidéo intelligente basée sur l'intelligence artificielle. Elle permet d'analyser automatiquement les flux vidéo en temps réel pour détecter la présence de personnes, identifier les individus autorisés et non autorisés, et comptabiliser les entrées/sorties dans des zones spécifiques.

## 🎯 Objectifs du Projet

- **Surveillance automatisée** : Analyser les flux vidéo en temps réel sans supervision humaine constante
- **Détection intelligente** : Identifier les personnes, visages et objets avec précision
- **Contrôle d'accès** : Distinguer les personnes autorisées des intrus
- **Comptage avancé** : Mesurer les flux de personnes dans différentes zones
- **Alertes en temps réel** : Notifier immédiatement en cas d'événements anormaux
- **Interface intuitive** : Fournir une interface de configuration et supervision facile d'utilisation

## 🏗️ Architecture

### Architecture Générale
- **Frontend** : Application React pour l'interface utilisateur
- **Backend** : Serveurs d'API RESTful pour la gestion des données
- **Traitement vidéo** : Service basé sur NVIDIA DeepStream pour l'analyse des flux
- **Base de données** : MySQL pour le stockage persistant
- **Stockage vidéo** : Système de fichiers pour l'archivage
- **Authentification** : Service de gestion des utilisateurs et droits d'accès
- **Streaming** : Conversion RTSP vers HLS pour visualisation web

### Architecture Containerisée
```
├── Frontend Container (React + Node.js)
├── Backend Container (API Node.js/Express)
├── Database Container (MySQL + phpMyAdmin)
├── Video Processing Container (NVIDIA DeepStream)
└── Streaming Container (HLS Server)
```

## 🚀 Technologies Utilisées

### Frontend
- **React** - Bibliothèque JavaScript pour interfaces utilisateur
- **CSS personnalisé** - Interface moderne et responsive
- **HLS.js** - Lecture des flux vidéo en streaming
- **Socket.IO** - Communication temps réel

### Backend
- **FastAPI** - Framework web moderne et performant pour Python
- **Uvicorn** - Serveur ASGI haute performance
- **Pydantic** - Validation et sérialisation des données

### Base de Données
- **MySQL** - Système de gestion de base de données relationnelle
- **phpMyAdmin** - Interface d'administration web

### Traitement Vidéo & IA
- **NVIDIA DeepStream** - Plateforme d'analyse vidéo temps réel
- **RTSP** - Protocole de transmission des flux caméras
- **HLS** - Diffusion des flux vers l'interface web
- **FFmpeg** - Conversion et traitement vidéo
- **Modèles YOLO** - Détection d'objets et personnes
- **OpenCV** - Traitement d'images et vidéo

### Déploiement
- **Docker** - Containerisation de l'application
- **Docker Compose** - Orchestration des conteneurs

## 📁 Structure du Projet

```
AI-Deep-Monitor/
├── Machine_GPU/
│   ├── api_marware/
│   ├── deep_ia/
│   └── teste_yacine_webtrc/
│       ├── detector/
│       ├── frontend/
│       └── gozrtc/
├── Machine_WEB/
│   ├── api/
│   ├── hls_output/
│   ├── mysql_data/
│   ├── nginx/
│   ├── react-app/
│   ├── react-template/
│   ├── src/nginx/
│   └── uploads/
└── Video_Web_Site/
```

## 🔧 Installation et Démarrage

### Prérequis
- Docker et Docker Compose installés
- GPU NVIDIA avec drivers compatibles (pour le traitement IA)
- Caméras IP compatibles RTSP

### Démarrage Rapide

1. **Cloner le repository**
```bash
git clone AI-Deep-Monitor
cd AI-Deep-Monitor
```

2. **Démarrer l'application web**
```bash
cd Machine_WEB
docker-compose up --build -d
```

3. **Accéder à l'application**
- Interface web : `http://localhost:3000`
- API Backend : `http://localhost:5000`
- Base de données : `http://localhost:8080` (phpMyAdmin)

## 📡 API Endpoints

### Gestion des Caméras
- `GET /api/cameras/` - Récupérer toutes les caméras
- `POST /api/cameras/` - Créer une nouvelle caméra
- `PUT /api/cameras/{id}` - Mettre à jour une caméra
- `DELETE /api/cameras/{id}` - Supprimer une caméra

### Gestion des Personnes
- `GET /api/personnes/` - Récupérer les personnes enregistrées
- `POST /api/personnes/` - Ajouter une nouvelle personne
- `GET /api/personnes/photo/{id}` - Récupérer la photo d'une personne

### Gestion des Images
- `POST /api/personnes/{id}/images/` - Télécharger une image
- `GET /api/images/inconnu/` - Images de personnes non identifiées

### Gestion des GPU
- `GET /api/gpu-groups/` - Récupérer les groupes GPU
- `POST /api/gpu-groups/` - Créer un groupe GPU
- `PUT /api/gpu-groups/{id}/status` - Activer/désactiver un groupe

### Flux Vidéo
- `POST /api/start-camera` - Démarrer un flux caméra
- `GET /api/stop-camera` - Arrêter un flux caméra
- `GET /api/active-streams` - Flux actifs
- `GET /api/person-count` - Comptage de personnes

### Zones d'Accès
- `GET /api/zones/` - Récupérer les zones d'accès
- `POST /api/zones/` - Créer une nouvelle zone

## 🎮 Fonctionnalités Principales

### Interface Utilisateur
- **Tableau de bord** - Vue d'ensemble des détections et statistiques
- **Gestion des caméras** - Configuration des flux vidéo et paramètres
- **Visualisation temps réel** - Flux vidéo avec annotations IA
- **Gestion des utilisateurs** - Administration des personnes autorisées
- **Configuration des zones** - Définition des zones d'accès
- **Administration IA** - Gestion des modèles et paramètres

### Capacités IA
- **Détection de personnes** - Identification en temps réel
- **Reconnaissance faciale** - Comparaison avec base de données
- **Détection d'objets** - Identification d'éléments spécifiques
- **Comptage intelligent** - Suivi des entrées/sorties par zone
- **Analyse comportementale** - Détection d'anomalies

## 🔒 Sécurité

- **Authentification** - Système de tokens sécurisés
- **Contrôle d'accès** - Gestion des rôles et permissions
- **Chiffrement** - Protection des données sensibles
- **Audit** - Logs complets des actions utilisateur

## 📈 Monitoring et Performances

- **Métriques temps réel** - Statistiques de détection
- **Allocation GPU** - Optimisation des ressources de calcul
- **Qualité des flux** - Adaptation automatique selon la bande passante
- **Historique** - Archivage des détections et événements

## 🛠️ Configuration

### Variables d'Environnement
```env
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=password
DB_NAME=ai_monitor
API_PORT=5000
FRONTEND_PORT=3000
```

### Configuration Caméras
- Support RTSP standard
- Résolutions multiples par caméra
- Configuration codec et FPS
- Zones de détection personnalisables

## 📊 Base de Données

### Tables Principales
- **cameras** - Configuration des caméras
- **personnes** - Personnes autorisées avec photos
- **zones** - Zones d'accès définies
- **detections** - Historique des détections
- **gpu_groups** - Configuration des processeurs
- **models** - Modèles IA et paramètres

## 🔄 Flux de Traitement

1. **Acquisition** - Réception des flux RTSP des caméras
2. **Prétraitement** - Décapsulation et optimisation des flux
3. **Analyse IA** - Inférence sur GPU avec modèles DeepStream
4. **Métadonnées** - Génération des données de détection
5. **Stockage** - Sauvegarde en base de données
6. **Diffusion** - Streaming HLS vers interface web
7. **Alertes** - Notifications temps réel des événements

## 🚀 Améliorations Futures

- **WebRTC** - Réduction de la latence vidéo
- **Modèles IA avancés** - Amélioration de la précision
- **Analyse comportementale** - Détection d'anomalies complexes
- **Application mobile** - Interface dédiée smartphones/tablettes
- **Rapports automatisés** - Génération de statistiques périodiques

## 📝 Notes de Développement

- **Code modulaire** - Architecture en composants réutilisables
- **API RESTful** - Communication standardisée frontend/backend
- **Documentation** - Swagger pour API, comments dans le code
- **Tests** - Couverture des fonctionnalités critiques
- **CI/CD** - Pipeline automatisé de déploiement

## 🎯 Cas d'Usage

- **Data Centers** - Surveillance des accès et équipements
- **Bureaux** - Contrôle d'accès et comptage de présence
- **Entrepôts** - Sécurité et suivi des mouvements
- **Commerces** - Analyse de fréquentation et sécurité
- **Infrastructures critiques** - Protection et monitoring avancé

## 🎥 Démo locale

Téléchargez et lisez la [vidéo de démonstration](Video_Web_Site/Video.mkv) localement.