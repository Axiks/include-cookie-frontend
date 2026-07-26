# syntax=docker.io/docker/dockerfile:1
# Standalone build — context = repo ROOT.
#   docker build -t pandc-web .
#
# DB: web uses PostgreSQL (database pandc_web on the shared pandc-db). The schema is applied at
# deploy time by the one-shot pandc-migrate service (infra/migrate.Dockerfile, monorepo side) —
# NOT baked here.

FROM node:25-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
# npm install (not ci): a lockfile generated on Windows omits some Linux-only
# optional/platform deps (e.g. @esbuild/linux-*), which strict `npm ci` rejects.
# install resolves them for the build platform.
RUN --mount=type=cache,target=/root/.npm npm install --no-audit --no-fund

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Inject git commit at build time via --build-arg (no git binary needed)
ARG GIT_COMMIT=unknown
RUN echo "\nGIT_COMMIT=${GIT_COMMIT}" >> .env.local

# Generate the web Prisma client (folder schema — models live in prisma/models/). A dummy postgres
# URL satisfies the datasource — `generate` never connects.
RUN DATABASE_URL="postgresql://x:x@localhost:5432/x" npx prisma generate --schema prisma/

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Generated Prisma client (engine) for runtime queries. DATABASE_URL (set in compose) points at the
# Postgres pandc_web database. Migrations run separately (pandc-migrate).
COPY --from=builder --chown=nextjs:nodejs /app/.generated ./.generated
# Only GIT_COMMIT env — all secrets provided at runtime via docker-compose env_file
COPY --from=builder /app/.env.local ./.env.local

EXPOSE 3000
ENV PORT=3000

USER nextjs
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
