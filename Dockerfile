# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

# Copy built code and required node_modules for srvx runner
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Coolify injects PORT at runtime; srvx reads HOST/PORT automatically
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["bun", "x", "srvx", "serve", "--entry", "./dist/server/server.js", "-s", "../client", "--prod"]
