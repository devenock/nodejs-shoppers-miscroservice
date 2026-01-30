# Comments Service

Product comments and nested replies. Publishes comment events; consumes `product.deleted` and `user.deleted`.

**Port**: 3003  
**DB**: MongoDB (`comments_db`)

## Env

See `.env.example`. Required: `PORT`, `DB_*`, `REDIS_*`, `JWT_SECRET`.

## Endpoints

- `GET /api/comments/product/:productId` – list (query: limit, skip)
- `POST /api/comments` – add (auth; body: productId, body, optional parentId, rating)
- `PUT /api/comments/:id` – update (auth; owner only)
- `DELETE /api/comments/:id` – delete (auth; owner only)
- `POST /api/comments/:id/flag` – flag for moderation (auth)

## Events

**Published**: `comment.created`, `comment.updated`, `comment.deleted`, `comment.flagged`  
**Consumed**: `product.deleted` (delete comments), `user.deleted` (anonymize comments)

## Run

```bash
npm install && npm run dev
```
