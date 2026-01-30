# Auth Service

User registration, login, JWT issue/refresh, profile. Publishes `user.created` (and optionally `user.updated` / `user.deleted`).

**Port**: 3001  
**DB**: MongoDB (`auth_db`)

## Env

See `.env.example`. Required: `PORT`, `DB_*`, `REDIS_*`, `JWT_SECRET`, `JWT_EXPIRY`.

## Endpoints

- `POST /api/auth/register` – register
- `POST /api/auth/login` – login (rate limited)
- `POST /api/auth/refresh` – refresh token
- `GET /api/auth/verify` – validate token
- `GET /api/auth/profile` – profile (auth required)

## Events

**Published**: `user.created`

## Run

```bash
npm install && npm run dev
```

With Docker infra: `docker compose up -d` then `npm run dev` (set `DB_HOST=mongodb`, `REDIS_HOST=redis` or use root `.env`).
