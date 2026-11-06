# Dockerfile for KINETIC OS
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies for better-sqlite3 if needed
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/server ./server

RUN mkdir -p /app/data

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "server.js"]
