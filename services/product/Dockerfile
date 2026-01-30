# Build from repo root: docker build -f services/product/Dockerfile .
FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/product/package*.json ./services/product/
WORKDIR /app/services/product
RUN npm ci --omit=dev
COPY services/product/ .
EXPOSE 3002
CMD ["node", "src/index.js"]
