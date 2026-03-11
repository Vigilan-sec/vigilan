# syntax=docker/dockerfile:1.7

# Stage 1: Install dependencies
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --include=optional --prefer-offline

# Stage 2: Build the application
FROM node:22-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure optional public dir exists for copy in runner stage.
RUN mkdir -p /app/public

# Build-time env vars (baked into the JS bundle for client-side use)
ARG NEXT_PUBLIC_WS_URL=
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}

# Backend URL for Next.js rewrites (used by the standalone server).
ARG BACKEND_URL=http://localhost:8000
ENV BACKEND_URL=${BACKEND_URL}

# Build standalone output
RUN --mount=type=cache,target=/app/.next/cache npm run build

# Stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BACKEND_URL=${BACKEND_URL}

# Copy standalone build output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
