# Dockerfile para el frontend Snake Neon
# Sirve los archivos estaticos con Nginx y redirige /api al backend.

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html

EXPOSE 80
