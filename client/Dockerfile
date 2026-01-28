FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/client/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf.template

ENV SERVER_HOST=server
ENV SERVER_PORT=5000

EXPOSE 4200

# Use envsubst to replace environment variables in nginx config at startup
CMD ["/bin/sh", "-c", "envsubst '${SERVER_HOST} ${SERVER_PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]

LABEL org.opencontainers.image.source=https://github.com/LocalCrag/LocalCragApp
LABEL org.opencontainers.image.description="Client for LocalCrag, a climbing crag database and guidebook platform."
LABEL org.opencontainers.image.licenses="AGPL-3.0"
