# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage ---
# `serve` is a tiny static file server — plenty for a Vite build. In actual
# production this app is deployed to Vercel instead (see README), so this
# container exists mainly for local docker-compose testing and any
# non-Vercel host you might use later.
FROM node:20-slim AS runtime
WORKDIR /app
RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 4173
CMD ["serve", "-s", "dist", "-l", "4173"]