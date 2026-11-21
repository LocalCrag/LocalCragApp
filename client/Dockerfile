FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Next images pass a build id (commit hash and time). Release builds omit it.
# $$ keeps Docker from expanding the variable before the shell and node see it.
ARG APP_VERSION=
RUN if [ -n "$$APP_VERSION" ]; then \
      node -e 'const fs=require("fs"); fs.writeFileSync("src/environments/build-info.ts", "export const buildVersion: string | null = " + JSON.stringify(process.env.$$APP_VERSION) + ";\n");'; \
    fi
RUN npm run build

FROM nginx:1.30.7-alpine
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
