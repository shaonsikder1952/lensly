# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build for Node server
COPY . .
RUN NITRO_PRESET=node-server bun run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS runner
WORKDIR /app

# Only copy the built output — no source, no node_modules
COPY --from=builder /app/.output ./.output

# Coolify injects PORT at runtime; Nitro reads HOST/PORT automatically
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

CMD ["bun", ".output/server/index.mjs"]
