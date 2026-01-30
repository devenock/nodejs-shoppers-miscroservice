# Payment Service (TypeScript)

Payment processing, idempotent handling of `order.created`, status state machine, blockchain stub.

**Port**: 3004  
**DB**: PostgreSQL (`payment_db`)

## Env

See `.env.example`. Required: `PORT`, `DB_*`, `REDIS_*`, `JWT_SECRET`. Optional: `BLOCKCHAIN_RPC_URL`.

## Endpoints

- `POST /api/payments/initiate` – create payment (auth; body: orderId, amount, idempotencyKey)
- `GET /api/payments/:id` – get payment (auth)
- `GET /api/payments/order/:orderId` – list payments for order (auth)
- `POST /api/payments/:id/refund` – refund completed payment (auth)

## Events

**Published**: `payment.initiated`, `payment.completed`, `payment.failed`, `payment.refunded`  
**Consumed**: `order.created` (payload: orderId, userId, totalAmount)

## Run

```bash
npm install && npm run build && npm run dev
```
