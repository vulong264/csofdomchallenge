# syntax=docker/dockerfile:1

# ── Multi-stage build for Next.js (standalone output) on Cloud Run ──
# Produces a slim runtime image that runs `.next/standalone/server.js`
# without node_modules. Cloud Run injects $PORT (default 8080).

FROM node:22-alpine AS base

# 1. Install dependencies only when lockfile changes (better layer caching).
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build the app and emit the standalone server bundle.
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Minimal runtime image.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# `output: standalone` does not copy public/ or .next/static — bring them in
# so server.js serves static assets directly (no CDN in this setup).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Cloud Run sends traffic to $PORT; server.js honours PORT/HOSTNAME.
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
EXPOSE 8080

CMD ["node", "server.js"]
