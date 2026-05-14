# Dockerfile para el backend Snake Neon
# Usa Node.js para servir el frontend estatico y la API REST.

FROM node:20-alpine
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
