# syntax=docker/dockerfile:1

# ---------- Build stage ----------
# Same major Node version as CI (see .github/workflows/ci.yml) so "works in
# CI" and "works in the container" mean the same thing.
FROM node:24-slim AS build
WORKDIR /app

# Prisma's query engine needs OpenSSL to pick the right libssl target.
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

# Copy only the dependency manifests first. Docker caches each step, so
# `npm ci` re-runs only when package*.json or the Prisma schema change,
# not on every source-code edit.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

# Drop devDependencies (typescript, vitest, ...) and regenerate the Prisma
# client against the pruned tree. The runtime stage copies this finished
# node_modules instead of running `npm ci` a second time over the network.
RUN npm prune --omit=dev && npx prisma generate

# ---------- Runtime stage ----------
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package*.json ./

# Never run the app as root: if the process were ever compromised, the
# attacker would get an unprivileged user instead of full control of the
# container. The official Node image ships a ready-made `node` user.
USER node

EXPOSE 4000

# Docker (and Compose) mark the container "healthy" only once this passes.
# Uses Node's built-in fetch because the slim image has no curl/wget.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Apply pending DB migrations, then start the API. Calls the local prisma
# binary directly (no `npx`) so startup never hits the network.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]