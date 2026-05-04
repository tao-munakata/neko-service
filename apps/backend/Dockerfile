FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── 開発 ──────────────────────────────────────────
FROM base AS dev
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ── ビルド ────────────────────────────────────────
FROM base AS builder
RUN npm ci
COPY . .
RUN npm run build

# ── 本番 ──────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 3001
CMD ["node", "dist/main.js"]
