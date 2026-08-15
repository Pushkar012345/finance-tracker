# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

# bcrypt is a native addon — alpine (musl) doesn't always have a prebuilt
# binary for it, so build tools need to be present for npm to compile it
# from source as a fallback.
FROM base AS with-build-tools
RUN apk add --no-cache python3 make g++

# ---- Dependencies (cached layer) ----
FROM with-build-tools AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build ----
FROM base AS build
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production dependencies only ----
FROM with-build-tools AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package.json ./

USER app
EXPOSE 4000

# Applies any pending migrations, then starts the server. Safe to run on
# every boot: prisma migrate deploy is a no-op if the DB is already current.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]