# Étape build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json vite.config.js index.html ./
RUN npm install
COPY src ./src
RUN npm run build

# Étape nginx (serve + proxy)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
