# Multi-stage Dockerfile for KINETIC OS
FROM node:22-slim AS builder

WORKDIR /app

# Install build essentials for native compilation
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Runner stage
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies for better-sqlite3 native addon
RUN apt-get update && apt-get install -y python3 make g++ gcc && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/server ./server

RUN mkdir -p /app/data

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "server.js"]
