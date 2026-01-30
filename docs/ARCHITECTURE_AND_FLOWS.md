# Architecture, Decisions, and Service Flows

This document summarizes what was built (Phases 0–7), key decisions, and the flow of each service (events in/out and saga).

---

## 1. What Was Done (Phases 0–7)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **0** | Project foundation: root `package.json`, `docker-compose.yml` (MongoDB, PostgreSQL, Redis), `.env.example`, `common/` (event envelope, errors, logger) | Done |
| **1** | Auth service (port 3001): register, login, refresh, verify, profile; JWT, bcrypt, Redis events; MongoDB | Done |
| **2** | Product service (port 3002): CRUD, inventory, low-inventory event; consumes `order.confirmed`; MongoDB | Done |
| **3** | Comments service (port 3003): product comments, nested replies, flag; consumes `product.deleted`, `user.deleted`; MongoDB | Done |
| **4** | Payment service (port 3004, **TypeScript**): initiate, get, refund; consumes `order.created`; idempotent; PostgreSQL; blockchain stub | Done |
| **5** | Order service (port 3005, **TypeScript**): create, list, get, cancel; consumes `payment.completed`, `payment.failed`; PostgreSQL | Done |
| **6** | API Gateway (port 3000): proxy to all services, JWT validation for protected routes, rate limit, CORS | Done |
| **7** | Full stack: all services + gateway in `docker-compose.yml`; `npm run seed`, `npm run e2e`; health deps | Done |

**Not done**: Phase 8 (real blockchain integration). Payment/Order keep a blockchain stub only.

---

## 2. Key Decisions

- **Language**: Auth, Product, Comments, Gateway = **JavaScript**. Payment and Order = **TypeScript** (per requirement).
- **Databases**: MongoDB for Auth, Product, Comments (flexible schemas, Mongoose). PostgreSQL for Payment, Order (ACID, `pg`).
- **Event bus**: **Redis** Pub/Sub. Event envelope and correlation IDs in `common`; no RabbitMQ yet.
- **Auth**: JWT issued by Auth service; same `JWT_SECRET` in Gateway and all services that validate tokens.
- **Gateway**: Validates JWT for all `/api/*` except auth register/login/refresh/verify and `/health`. Returns 401 before proxying; services also validate JWT on protected routes.
- **Idempotency**: Payment creates one payment per `orderId`; Order confirms once per `payment.completed`; Product reduces inventory once per `orderId` (ProcessedOrder).
- **Testing**: Integration tests per service (Node `--test` + Supertest); E2E script for order flow. Integration tests use real DB/Redis (Docker) or in-memory/test DB where applicable.
- **Docker**: Services that use `common` are built with repo root as context; gateway builds from `gateway/`. Postgres init script creates `payment_db` and `order_db` on first run.

---

## 3. Service Flow Summary

### 3.1 API Gateway (3000)

- **Role**: Single entry point; no business logic.
- **In**: HTTP from client.
- **Out**: Proxies to Auth (3001), Product (3002), Comments (3003), Payment (3004), Order (3005) by path prefix.
- **Flow**: Request → CORS → rate limit → JWT check (skip for public auth paths) → proxy to service → response (or 401/502).

### 3.2 Auth Service (3001)

- **Role**: User identity, JWT issue/refresh.
- **DB**: MongoDB `auth_db`, collection `users`.
- **In**: HTTP (register, login, refresh, verify, profile).
- **Out**: Publishes `user.created` on register (and optionally updated/deleted if implemented).
- **Flow**: Register → hash password → save user → publish `user.created` → return user + JWT. Login → verify password → return user + JWT. Profile/verify use JWT from header.

### 3.3 Product Service (3002)

- **Role**: Catalog, inventory, low-stock alerts.
- **DB**: MongoDB `product_db`, collections `products`, `processedorders` (idempotency for inventory).
- **In**: HTTP (CRUD); **events**: `order.confirmed`.
- **Out**: Publishes `product.created`, `product.updated`, `product.deleted`, `product.inventory.low`.
- **Flow**: On `order.confirmed`: if orderId already in ProcessedOrder, skip; else in a transaction decrement inventory per item, insert ProcessedOrder, and if inventory &lt; threshold publish `product.inventory.low`.

### 3.4 Comments Service (3003)

- **Role**: Product comments and replies, moderation flag.
- **DB**: MongoDB `comments_db`, collection `comments`.
- **In**: HTTP (list by product, create, update, delete, flag); **events**: `product.deleted`, `user.deleted`.
- **Out**: Publishes `comment.created`, `comment.updated`, `comment.deleted`, `comment.flagged`.
- **Flow**: On `product.deleted`: delete comments for that productId. On `user.deleted`: anonymize comments for that userId (body → `[deleted]`, userId → `deleted`).

### 3.5 Payment Service (3004, TypeScript)

- **Role**: Payment lifecycle for orders; idempotent; blockchain stub.
- **DB**: PostgreSQL `payment_db`, table `payments`.
- **In**: HTTP (initiate, get, get by order, refund); **events**: `order.created`.
- **Out**: Publishes `payment.initiated`, `payment.completed`, `payment.failed`, `payment.refunded`.
- **Flow**: On `order.created`: if payment already exists for orderId, skip; else create payment (status processing), publish `payment.initiated`, then mock-complete and publish `payment.completed` (or on error `payment.failed`). Refund only for status `completed`.

### 3.6 Order Service (3005, TypeScript)

- **Role**: Order CRUD and saga coordination with Payment (and indirectly Product).
- **DB**: PostgreSQL `order_db`, tables `orders`, `order_items`.
- **In**: HTTP (create, list, get, cancel); **events**: `payment.completed`, `payment.failed`.
- **Out**: Publishes `order.created`, `order.confirmed`, `order.cancelled`.
- **Flow**: Create order → persist → publish `order.created` (Payment consumes). On `payment.completed`: if order still pending, set status confirmed and publish `order.confirmed` (Product consumes and reduces inventory). On `payment.failed`: if pending, set cancelled and publish `order.cancelled`. Cancel endpoint: only pending orders, same user; set cancelled and publish `order.cancelled`.

---

## 4. Order Saga (End-to-End Flow)

1. **Client** → Gateway → **Order**: `POST /api/orders` (items, totalAmount).
2. **Order** saves order, publishes **`order.created`** (orderId, userId, totalAmount, items).
3. **Payment** consumes `order.created`, creates payment (idempotent), publishes **`payment.initiated`**, then **`payment.completed`** (mock).
4. **Order** consumes `payment.completed`, sets order to confirmed, publishes **`order.confirmed`** (orderId, userId, totalAmount, items).
5. **Product** consumes `order.confirmed`, decrements inventory per item (idempotent by orderId), optionally publishes **`product.inventory.low`** if below threshold.

Failure path: Payment publishes **`payment.failed`** → Order consumes and sets order to **cancelled**, publishes **`order.cancelled`**.

---

## 5. Event Reference (Quick)

| Event | Publisher | Consumers | Purpose |
|-------|-----------|-----------|---------|
| `user.created` | Auth | (future) | New user |
| `product.created/updated/deleted` | Product | - | Catalog changes |
| `product.inventory.low` | Product | (alerts) | Low stock |
| `order.created` | Order | Payment | Start payment |
| `order.confirmed` | Order | Product | Reduce inventory |
| `order.cancelled` | Order | - | Order cancelled |
| `payment.initiated/completed/failed` | Payment | Order | Confirm or cancel order |
| `payment.refunded` | Payment | - | Refund recorded |
| `comment.created/updated/deleted/flagged` | Comments | - | Moderation/analytics |
| `product.deleted` | Product | Comments | Delete product comments |
| `user.deleted` | Auth | Comments | Anonymize user comments |

---

## 6. How to Run and Test

- **Full stack**: `docker compose up -d` then use `http://localhost:3000` (see [API_AND_TESTING.md](./API_AND_TESTING.md)).
- **Seed**: `npm run seed` (creates test user and sample product).
- **E2E**: `npm run e2e` (register/login → list products → create order → poll until confirmed).
- **Per-service tests**: From repo root, `npm test`; or `cd services/<name>` / `cd gateway` then `npm test`. Auth/Product/Comments/Payment/Order integration tests expect DB and Redis (e.g. Docker) with env like `DB_HOST=localhost REDIS_HOST=localhost`.
