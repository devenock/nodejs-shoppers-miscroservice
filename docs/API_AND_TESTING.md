# API and Testing Guide

Use this guide to test all endpoints via the **API Gateway** (single entry point).

**Base URL**: `http://localhost:3000` (gateway).  
If you run services directly: Auth `3001`, Product `3002`, Comments `3003`, Payment `3004`, Order `3005`.

**Authentication**: All endpoints except auth register/login/refresh/verify require a JWT in the header:
```http
Authorization: Bearer <your-jwt-token>
```

---

## 1. Start the stack

```bash
# From repo root: start infra + all services + gateway
docker compose up -d

# Optional: seed test user and a product
npm run seed
```

Then use `http://localhost:3000` for all examples below. Replace `TOKEN` with the token you get from login/register.

---

## 2. Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login |
| POST | /api/auth/refresh | No | Refresh token |
| GET | /api/auth/verify | No | Verify token |
| GET | /api/auth/profile | Yes | Get profile |

### Register
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"My Name"}' | jq
```
Response: `{ "user": { "id", "email", "name" }, "token": "..." }`

### Login
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' | jq
```
Response: `{ "user", "token" }`. Save `token` for other requests.

### Verify token
```bash
curl -s http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer TOKEN" | jq
```
Response: `{ "valid": true, "userId": "..." }`

### Profile (protected)
```bash
curl -s http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN" | jq
```

---

## 3. Products (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/products | Yes | List (query: category, search, limit, skip) |
| GET | /api/products/:id | Yes | Get one |
| POST | /api/products | Yes | Create |
| PUT | /api/products/:id | Yes | Update |
| DELETE | /api/products/:id | Yes | Delete |

### List products
```bash
curl -s http://localhost:3000/api/products \
  -H "Authorization: Bearer TOKEN" | jq
```

### Create product
```bash
curl -s -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","description":"A laptop","price":999.99,"inventory":50,"category":"electronics"}' | jq
```

### Get product by ID
```bash
curl -s http://localhost:3000/api/products/PRODUCT_ID \
  -H "Authorization: Bearer TOKEN" | jq
```

---

## 4. Comments (`/api/comments`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/comments/product/:productId | Yes | List by product |
| POST | /api/comments | Yes | Add (body: productId, body, optional parentId, rating) |
| PUT | /api/comments/:id | Yes | Update (owner only) |
| DELETE | /api/comments/:id | Yes | Delete (owner only) |
| POST | /api/comments/:id/flag | Yes | Flag for moderation |

### List comments for a product
```bash
curl -s "http://localhost:3000/api/comments/product/PRODUCT_ID" \
  -H "Authorization: Bearer TOKEN" | jq
```

### Add comment
```bash
curl -s -X POST http://localhost:3000/api/comments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"PRODUCT_ID","body":"Great product!"}' | jq
```

---

## 5. Payments (`/api/payments`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/payments/initiate | Yes | Create payment (body: orderId, amount, optional idempotencyKey) |
| GET | /api/payments/:id | Yes | Get payment |
| GET | /api/payments/order/:orderId | Yes | List payments for order |
| POST | /api/payments/:id/refund | Yes | Refund completed payment |

### Initiate payment (usually triggered by order.created event)
```bash
curl -s -X POST http://localhost:3000/api/payments/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORDER_ID","amount":99.99}' | jq
```

### Get payment by order
```bash
curl -s "http://localhost:3000/api/payments/order/ORDER_ID" \
  -H "Authorization: Bearer TOKEN" | jq
```

---

## 6. Orders (`/api/orders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/orders | Yes | Create (body: items[], totalAmount) |
| GET | /api/orders | Yes | List user orders |
| GET | /api/orders/:id | Yes | Get order |
| PUT | /api/orders/:id/cancel | Yes | Cancel pending order |

### Create order (triggers saga: order.created → payment → order.confirmed → inventory)
```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items":[{"productId":"PRODUCT_ID","quantity":2,"price":29.99}],
    "totalAmount":59.98
  }' | jq
```
Response: `{ "id", "user_id", "total_amount", "status": "pending", "items", ... }`. Payment service consumes `order.created` and publishes `payment.completed`; Order service then confirms and publishes `order.confirmed`; Product service reduces inventory.

### List my orders
```bash
curl -s http://localhost:3000/api/orders \
  -H "Authorization: Bearer TOKEN" | jq
```

### Get order by ID
```bash
curl -s http://localhost:3000/api/orders/ORDER_ID \
  -H "Authorization: Bearer TOKEN" | jq
```

### Cancel order
```bash
curl -s -X PUT "http://localhost:3000/api/orders/ORDER_ID/cancel" \
  -H "Authorization: Bearer TOKEN" | jq
```

---

## 7. Health

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Gateway health |
| GET | /health/ready | Gateway readiness |

```bash
curl -s http://localhost:3000/health | jq
```

---

## 8. Suggested test flow

1. **Start stack**: `docker compose up -d`
2. **Seed** (optional): `npm run seed` → creates `test@example.com` / `password123` and a sample product
3. **Login**: `POST /api/auth/login` → save `token`
4. **List products**: `GET /api/products` → note a `_id`
5. **Create order**: `POST /api/orders` with `items: [{ productId, quantity, price }]`, `totalAmount`
6. **Poll order**: `GET /api/orders/:id` until `status` is `confirmed` (payment saga runs asynchronously)
7. **E2E script**: `npm run e2e` runs register/login → list products → create order → poll until confirmed

---

## 9. Errors

- **401**: Missing or invalid `Authorization: Bearer <token>`
- **400**: Validation error (check `error` in JSON body)
- **404**: Resource not found
- **502**: Gateway could not reach a service (service down or wrong URL)
