FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/client/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]

LABEL org.opencontainers.image.source=https://github.com/LocalCrag/LocalCragApp
LABEL org.opencontainers.image.description="Client for LocalCrag, a climbing crag database and guidebook platform."
LABEL org.opencontainers.image.licenses="AGPL-3.0"
