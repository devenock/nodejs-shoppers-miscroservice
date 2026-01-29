# Project Analysis & Phased Build Plan

This document summarizes analysis of the existing project files (README.md, AGENTS.md), findings, and a step-by-step plan to build the microservices platform one service at a time with review and testing at each stage.

---

## 1. Analysis Summary

### 1.1 README.md

**Purpose**: Product and architecture documentation for the Blockchain-Integrated E-Commerce Microservices Platform.

**Strengths**:
- **Clear architecture**: High-level diagram, port assignments (3000–3005), and communication patterns (sync via Gateway, async via Event Bus).
- **Service specs**: Each service has responsibilities, database, published/consumed events, and API endpoints defined.
- **Tech stack**: Node 20, Express, MongoDB (Auth/Product/Comments), PostgreSQL (Payment/Order), Redis → RabbitMQ, JWT, Docker.
- **Operational detail**: Env vars, health checks, testing strategy, deployment (Digital Ocean), and event saga flow.
- **Learning focus**: Explicit learning objectives and “Benefits for Interviews” for blockchain.

**Issues found (and fixed)**:
1. **Typo**: Line 26 had `\deployable` — fixed to `deployable`.
2. **Event inconsistency**: Product service “Events Consumed” said `order.completed`; the saga and event table use `order.confirmed` for inventory update. Updated to `order.confirmed` so docs match the intended flow.

**Gaps**:
- README references assets that don’t exist yet: `install:all`, `npm run seed`, `docker-compose.dev.yml`, `CONTRIBUTING.md`, `docs/postman/collection.json`. These will be added as we build.

---

### 1.2 AGENTS.md

**Purpose**: Contract for AI agents (and humans) on how to implement and evolve the system.

**Strengths**:
- **Concrete patterns**: File layout per service, error classes, Joi validation, Winston logging, JWT middleware, Mongoose/PostgreSQL usage.
- **Architecture rules**: Allowed vs forbidden communication (no shared DB, no direct service-to-service DB access), idempotent event handlers, standard event schema with correlation/causation IDs.
- **Service-specific rules**: Auth (bcrypt, JWT, rate limiting), Product (inventory, low-stock events), Payment (idempotency, state machine, blockchain), Order (saga, state machine), Comments (nested replies, moderation).
- **Templates**: Event publisher/subscriber (Redis), testing structure, JSDoc style.
- **Pitfalls**: Shared DB, sync service calls, non-idempotent handlers — with “don’t / do” examples.

**Minor note**:
- Event publisher example uses `const EventEmitter = require('events');` but the class only uses Redis; the import is unused. Safe to drop when implementing.

**Alignment with README**:
- Ports, databases, event names, and saga flow align. After the README fix, Product consistently consumes `order.confirmed`.

---

## 2. Findings & Recommendations

| Finding | Recommendation |
|--------|----------------|
| **No codebase yet** | Follow the phased plan below; create root structure and shared concerns first, then one service at a time. |
| **Auth is the dependency root** | Build Auth first; other services and the Gateway depend on JWT format and behavior. |
| **Event schema is shared** | Introduce a small shared layer (e.g. `common/` or `shared/`) for event envelope, logger interface, and error types so all services stay consistent. |
| **Order saga crosses 3 services** | Build Order and Payment with idempotent handlers and clear state machines; add Product event consumer when Order is ready so the full flow is testable. |
| **Blockchain is optional for MVP** | Implement Payment and Order with “blockchain stub” (e.g. log or no-op); add real blockchain integration once the saga is stable. |
| **Testing** | Per AGENTS.md: unit (>80% on business logic), integration on all endpoints, event tests. Add E2E when the main saga works. |

---

## 3. Phased Build Plan (One Service at a Time)

Each phase ends with: **you review the code → we fix feedback → you run tests (and optionally manual checks) → we proceed.**

---

### Phase 0: Project Foundation (before first service)

**Goal**: Root layout, scripts, and shared infra so every service can be added in a consistent way.

**Deliverables**:
- Root `package.json` with workspace or script to run each service and tests (`install:all`, `dev`, `test`, etc.).
- `docker-compose.yml`: MongoDB, PostgreSQL, Redis (and optionally RabbitMQ placeholder), no app services yet.
- `docker-compose.dev.yml` (or override): same for local dev, with volume mounts if needed.
- `.env.example` at root listing all variables (with placeholders) for Gateway and every service.
- Optional: `common/` (or `shared/`) with:
  - Event envelope builder and parser (eventId, eventType, timestamp, version, source, data, metadata.correlationId, causationId).
  - Shared error classes (e.g. ApplicationError, ValidationError, NotFoundError).
  - Logger factory (Winston) that accepts service name.

**Review**: Directory layout, env var names, and Docker Compose. No service code yet.

**Test**: `docker-compose up -d` and confirm MongoDB, PostgreSQL, and Redis are reachable.

---

### Phase 1: Auth Service (Port 3001)

**Goal**: Registration, login, JWT issue/refresh, and `user.created` / `user.updated` / `user.deleted` events.

**Deliverables**:
- Full Auth service under `services/auth/` per AGENTS.md structure (config, models, controllers, services, routes, events, middleware, utils).
- Mongoose User model (email, hashed password, name, timestamps); no plain-text password in responses.
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/verify`, `GET /api/auth/profile` (protected).
- bcrypt (min 10 rounds), JWT (configurable expiry), rate limiting on login, email validation.
- Event publisher: publish `user.created` on register; optionally `user.updated` / `user.deleted` if implemented.
- Health: `GET /health`, `GET /health/ready`, `GET /health/live`.
- `Dockerfile`, `services/auth/.env.example`, and service README.
- Unit tests (auth logic, validation) and integration tests (all endpoints).

**Review**: Security (no password leak, rate limit, JWT claims), event payload shape, and alignment with AGENTS.md.

**Test**: Unit + integration; manual: register, login, refresh, verify, profile with token; confirm `user.created` in Redis.

---

### Phase 2: Product Service (Port 3002)

**Goal**: Product CRUD, inventory, low-inventory event, and subscription to `order.confirmed` to reduce inventory.

**Deliverables**:
- Product service under `services/product/` (same standard structure).
- Mongoose Product model (name, description, price, inventory, category, indexes, text search if needed).
- Endpoints: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` (admin/auth as per README).
- Inventory decrement with optimistic locking or transactions; emit `product.inventory.low` when below threshold.
- Event subscriber: on `order.confirmed`, parse order items and reduce inventory (idempotent by order id or idempotency key).
- Event publisher: `product.created`, `product.updated`, `product.deleted`, `product.inventory.low`.
- Dockerfile, .env.example, README, unit + integration tests.

**Review**: Idempotency of inventory update, handling of insufficient inventory (e.g. don’t partially decrement), and event schema.

**Test**: Unit + integration; manual: create product, list, get; publish test `order.confirmed` and verify inventory and `product.inventory.low` when applicable.

---

### Phase 3: Comments Service (Port 3003)

**Goal**: Comments and replies for products, with events and optional moderation.

**Deliverables**:
- Comments service under `services/comments/`.
- Mongoose model(s): Comment (productId, userId, body, parentId for replies, rating, moderation flags, timestamps).
- Endpoints: `GET /api/comments/product/:productId`, `POST /api/comments`, `PUT /api/comments/:id`, `DELETE /api/comments/:id`.
- Event publisher: `comment.created`, `comment.updated`, `comment.deleted`, `comment.flagged`.
- Event subscriber: `product.deleted` → remove or anonymize comments for that product; `user.deleted` → handle user comment cleanup (per README).
- Dockerfile, .env.example, README, unit + integration tests.

**Review**: Nested replies (parentId), indexing for by-product and by-user, idempotency of event handlers.

**Test**: Unit + integration; manual: add comment, reply, get by product; emit `product.deleted` and verify cleanup.

---

### Phase 4: Payment Service (Port 3004)

**Goal**: Payment lifecycle driven by `order.created`, with idempotency and state machine; optional blockchain stub.

**Deliverables**:
- Payment service under `services/payment/` using PostgreSQL (native `pg` with pool).
- Tables: payments (id, order_id, amount, status, idempotency_key, etc.), optionally payment_events for audit.
- State machine: `initiated` → `processing` → `completed` | `failed`; support refunds.
- Event subscriber: on `order.created`, create payment (idempotent by order_id or idempotency key) and move to processing; then publish `payment.initiated`, then `payment.completed` or `payment.failed`.
- Event publisher: `payment.initiated`, `payment.completed`, `payment.failed`, `payment.refunded`.
- Endpoints: `POST /api/payments/initiate`, `GET /api/payments/:id`, `GET /api/payments/order/:orderId`, `POST /api/payments/:id/refund`.
- Blockchain: stub that “records” completed payments (log or in-memory); real integration later.
- Dockerfile, .env.example, README, migrations (e.g. SQL or simple script), unit + integration tests.

**Review**: Idempotency, state transitions, and that `order.created` payload has everything Payment needs (orderId, amount, etc.).

**Test**: Unit + integration; manual: emit `order.created`, confirm payment created and `payment.completed` published; test refund and failure paths.

---

### Phase 5: Order Service (Port 3005)

**Goal**: Order creation, saga coordination with Payment (and later Product), and order state machine.

**Deliverables**:
- Order service under `services/order/` using PostgreSQL.
- Tables: orders (id, user_id, total_amount, status, etc.), order_items (order_id, product_id, quantity, price).
- State machine: `pending` → `confirmed` → `processing` → `completed` | `cancelled` | `failed`.
- On create order: persist order, publish `order.created` (with orderId, userId, totalAmount, items).
- Event subscriber: on `payment.completed` → confirm order and publish `order.confirmed`; on `payment.failed` → cancel/fail order and publish `order.cancelled` or `order.failed`. All idempotent.
- Endpoints: `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `PUT /api/orders/:id/cancel`.
- Event publisher: `order.created`, `order.confirmed`, `order.completed`, `order.cancelled`, `order.failed`.
- Dockerfile, .env.example, README, migrations, unit + integration tests.

**Review**: Saga flow (order.created → payment → order.confirmed), idempotency, and that Order does not call Product DB (only events).

**Test**: Unit + integration; then **end-to-end**: create order via API → Payment consumes `order.created` → Payment publishes `payment.completed` → Order confirms and publishes `order.confirmed` → Product updates inventory. Optional E2E test script.

---

### Phase 6: API Gateway (Port 3000)

**Goal**: Single entry point, JWT validation, routing to Auth, Product, Comments, Payment, Order.

**Deliverables**:
- Gateway under `gateway/` (or `services/gateway/`): config, middleware (auth, rate limit, CORS, error handler), routes/proxy to each service.
- Route table: `/api/auth/*` → Auth, `/api/products/*` → Product, `/api/comments/*` → Comments, `/api/payments/*` → Payment, `/api/orders/*` → Order.
- JWT validation (same secret as Auth); optional public routes for register/login.
- Health aggregation: `GET /health` (and optionally `/health/ready`) that checks downstream services or just gateway process.
- Dockerfile, .env.example, README, integration tests (e.g. proxy and 401 when no token).

**Review**: No business logic in Gateway; consistent status codes and error format; rate limiting and CORS.

**Test**: All critical paths through Gateway: register, login, list products, create order, get order, with and without token.

---

### Phase 7: Docker Compose & E2E

**Goal**: Run full stack in Docker and validate the main user journey.

**Deliverables**:
- Add all services and Gateway to `docker-compose.yml` (and dev override) with correct env and dependencies (DBs, Redis first).
- Root scripts: `install:all`, `dev`, `test`, `docker:build`, `docker:up`, `docker:down`.
- Optional: `npm run seed` to create test user and products.
- E2E test or script: register → login → get products → create order → poll order status until confirmed; verify inventory decreased.

**Review**: Startup order, env injection, and no hardcoded hostnames that break in Docker.

**Test**: `docker-compose up --build`, run E2E, then tear down.

---

### Phase 8 (Optional): Blockchain Integration

**Goal**: Real or testnet recording of completed payments and/or order confirmations.

**Deliverables**:
- Blockchain adapter (e.g. under `blockchain/` or inside Payment/Order): write transaction hash or proof for completed payment and order.confirmed.
- Config (e.g. Ethereum/BSC testnet, private key for gas), documented in README.
- Keep Payment and Order unchanged in behavior; only add “record to chain” step after local commit.

**Review**: Security of keys, cost control (testnet), and failure handling (e.g. retry or queue).

**Test**: Run one payment and one order to completion and verify on-chain (or testnet) record.

---

## 4. Dependency Order (Summary)

```
Phase 0 (Foundation)
    ↓
Phase 1 (Auth) ──────────────────────────────────────────┐
    ↓                                                     │
Phase 2 (Product) ───────────────────────────────────────┤
    ↓                                                     │
Phase 3 (Comments) ───────────────────────────────────────┼→ Phase 6 (Gateway)
    ↓                                                     │
Phase 4 (Payment) ←───────────────────────────────────────┤
    ↓                                                     │
Phase 5 (Order) ──────────────────────────────────────────┘
    ↓
Phase 7 (Full stack E2E)
    ↓
Phase 8 (Blockchain, optional)
```

---

## 5. How We’ll Work Each Phase

1. **Implement**: I generate the code (and tests) for that phase following README + AGENTS.md.
2. **You review**: You read the diff, run linters, and spot any design or security concerns.
3. **Iterate**: We fix issues you find (and any test failures).
4. **You test**: You run unit/integration (and manual or E2E when relevant).
5. **Sign-off**: You confirm the phase is done; then we move to the next.

If you want to adjust the order (e.g. Gateway earlier for quick manual testing) or add/remove a phase, we can adapt this plan accordingly.

---

## 6. Next Step

Recommended next step: **Phase 0 (Project Foundation)**.  
Once you confirm, I’ll propose the root layout, `package.json` scripts, Docker Compose files, and optional `common/` module so that Phase 1 (Auth) can be implemented on a solid base.
