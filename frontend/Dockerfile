# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite bakes VITE_* variables into the JavaScript bundle at BUILD time, so
# the API URL has to be a build argument, not a runtime env var.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Runtime stage ----------
# nginx serves the compiled static files. This replaces `npm install -g serve`,
# which downloaded packages from the internet at build time (and is exactly
# what failed with ECONNRESET earlier). The "unprivileged" variant runs as a
# non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1