# Order Service (TypeScript)

Order creation, saga (order.created → payment → order.confirmed), cancel. Consumes payment.completed / payment.failed.

**Port**: 3005  
**DB**: PostgreSQL (`order_db`)

## Env

See `.env.example`. Required: `PORT`, `DB_*`, `REDIS_*`, `JWT_SECRET`.

## Endpoints

- `POST /api/orders` – create (auth; body: items[], totalAmount)
- `GET /api/orders` – list user orders (auth)
- `GET /api/orders/:id` – get order (auth)
- `PUT /api/orders/:id/cancel` – cancel pending order (auth)

## Events

**Published**: `order.created`, `order.confirmed`, `order.cancelled`  
**Consumed**: `payment.completed` (confirm), `payment.failed` (cancel)

## Run

```bash
npm install && npm run build && npm run dev
```
