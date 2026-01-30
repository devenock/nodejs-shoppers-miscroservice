# Build from repo root: docker build -f services/payment/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY common ./common
COPY services/payment/package*.json ./services/payment/
WORKDIR /app/services/payment
RUN npm ci
COPY services/payment/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/payment/package*.json ./services/payment/
WORKDIR /app/services/payment
RUN npm ci --omit=dev
COPY --from=builder /app/services/payment/dist ./dist
EXPOSE 3004
CMD ["node", "dist/index.js"]
