# Product Service

Product catalog CRUD, inventory tracking, and `order.confirmed` handler to reduce inventory.

**Port**: 3002  
**DB**: MongoDB (`product_db`)

## Env

See `.env.example`. Required: `PORT`, `DB_*`, `REDIS_*`, `JWT_SECRET`. Optional: `INVENTORY_LOW_THRESHOLD` (default 10).

## Endpoints

- `GET /api/products` – list (query: category, search, limit, skip)
- `GET /api/products/:id` – get one
- `POST /api/products` – create (auth)
- `PUT /api/products/:id` – update (auth)
- `DELETE /api/products/:id` – delete (auth)

## Events

**Published**: `product.created`, `product.updated`, `product.deleted`, `product.inventory.low`  
**Consumed**: `order.confirmed` (payload: orderId, items: [{ productId, quantity }])

## Run

```bash
npm install && npm run dev
```
