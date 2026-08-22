# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
# Generates the Prisma client against the schema, then compiles TS -> dist/
RUN npx prisma generate
RUN npm run build

# --- Runtime stage ---
# Slim, production-only image: no dev dependencies, no TS source, no build
# tools — just the compiled output and what it needs to run.
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]