# Utilisez une version LTS de Node.js pour plus de stabilité (au lieu de 22.11)
FROM node:20-alpine

# 1. Installez FFmpeg et les dépendances système nécessaires
RUN apk add --no-cache ffmpeg

# 2. Définissez le répertoire de travail
WORKDIR /usr/src/app

# 3. Copiez les fichiers de dépendances et installez avec --legacy-peer-deps
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps  

# 4. Copiez le reste de l'application
COPY . .

# 5. Exposez le port et lancez l'application
EXPOSE 5173
CMD ["npm", "run", "dev", "--host"]