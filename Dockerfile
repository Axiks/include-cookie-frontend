# syntax=docker.io/docker/dockerfile:1
# Standalone build — context = repo ROOT.
#   docker build -t pandc-web .
#
# No database of its own — all profile/identity state lives in Ory Kratos (shared instance).

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

RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Only GIT_COMMIT env — all secrets provided at runtime via docker-compose env_file
COPY --from=builder /app/.env.local ./.env.local

EXPOSE 3000
ENV PORT=3000

USER nextjs
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 node server.js"]
