# API Gateway (Port 3000)

Single entry point: routes `/api/*` to services, JWT validation for protected routes, rate limiting, CORS.

## Env

See `.env.example`. Required: `PORT`, `JWT_SECRET`, `*_SERVICE_URL` for each service.

## Routes

- `/api/auth/*` → Auth (3001); register, login, refresh, verify are public
- `/api/products/*` → Product (3002)
- `/api/comments/*` → Comments (3003)
- `/api/payments/*` → Payment (3004)
- `/api/orders/*` → Order (3005)

## Run

```bash
npm install && npm run dev
```

Start all services (or use docker-compose) then start gateway.
