# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /app

# Prisma's query engine needs OpenSSL to detect the correct libssl target
# at generate-time — node:20-slim doesn't ship it, which is what produces
# the "failed to detect the libssl/openssl version" warning at runtime.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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

# Same reasoning as the build stage: the runtime image also runs
# `prisma generate` (and the query engine itself needs OpenSSL at runtime
# to actually connect to Postgres), so it needs this too, independently
# of the build stage above.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]