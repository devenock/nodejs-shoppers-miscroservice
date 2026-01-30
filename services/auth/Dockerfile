# Build from repo root: docker build -f services/auth/Dockerfile .
FROM node:20-alpine
WORKDIR /app
COPY common ./common
COPY services/auth/package*.json ./services/auth/
WORKDIR /app/services/auth
RUN npm ci --omit=dev
COPY services/auth/ .
WORKDIR /app/services/auth
EXPOSE 3001
CMD ["node", "src/index.js"]