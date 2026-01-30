# Build from repo root: docker build -f services/comments/Dockerfile .
FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/comments/package*.json ./services/comments/
WORKDIR /app/services/comments
RUN npm ci --omit=dev
COPY services/comments/ .
EXPOSE 3003
CMD ["node", "src/index.js"]
