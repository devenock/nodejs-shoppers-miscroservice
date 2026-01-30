# Build from repo root: docker build -f services/order/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY common ./common
COPY services/order/package*.json ./services/order/
WORKDIR /app/services/order
RUN npm ci
COPY services/order/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/order/package*.json ./services/order/
WORKDIR /app/services/order
RUN npm ci --omit=dev
COPY --from=builder /app/services/order/dist ./dist
EXPOSE 3005
CMD ["node", "dist/index.js"]
