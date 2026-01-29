# Blockchain-Integrated E-Commerce Microservices Platform

A distributed, event-driven e-commerce backend system built with Node.js microservices
architecture, featuring blockchain integration for transaction transparency and immutability.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Services](#services)
- [Getting Started](#getting-started)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Event System](#event-system)
- [Blockchain Integration](#blockchain-integration)
- [Deployment](#deployment)
- [Testing](#testing)
- [Contributing](#contributing)

## 🎯 Overview

This project demonstrates a production-ready microservices architecture for an e-commerce
platform with blockchain integration. The system handles user authentication, product
management, order processing, payments, and user-generated content through independently
\deployable services that communicate via an event-driven architecture.

### Key Features

- **Microservices Architecture**: Five independent services with clear domain boundaries
- **Event-Driven Communication**: Asynchronous messaging using Redis(migrating to RabbitMQ)
- **Blockchain Integration**: Immutable transaction records and audit trails
- **Polyglot Persistence**: MongoDB and PostgreSQL for optimized data storage
- **API Gateway Pattern**: Centralized routing, authentication, and rate limiting
- **Docker Containerization**: Consistent deployment across environments
- **Distributed Transaction Management**: Saga pattern implementation

### Learning Objectives

- Event-driven architecture and eventual consistency
- Microservices design patterns (Saga, Circuit Breaker, API Gateway)
- Polyglot persistence strategies
- Distributed system challenges and solutions
- Blockchain integration in enterprise applications
- Container orchestration with Docker Compose

## 🏗️ Architecture

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         Client Layer                          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  API Gateway  │
                    │  (Express.js) │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Auth Service │    │Product Service│   │Comment Service│
│  (Port 3001) │    │  (Port 3002)  │   │  (Port 3003)  │
└──────┬───────┘    └──────┬────────┘   └──────┬────────┘
       │                   │                    │
       ▼                   ▼                    ▼
  ┌─────────┐         ┌─────────┐         ┌─────────┐
  │ MongoDB │         │ MongoDB │         │ MongoDB │
  └─────────┘         └─────────┘         └─────────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│Payment Service│   │ Order Service│    │   Blockchain │
│  (Port 3004)  │   │  (Port 3005) │    │    Layer     │
└──────┬────────┘   └──────┬───────┘    └──────────────┘
       │                   │
       ▼                   ▼
  ┌──────────┐        ┌──────────┐
  │PostgreSQL│        │PostgreSQL│
  └──────────┘        └──────────┘
        │                   │
        └───────────────────┼────────────────────┐
                            │                    │
                            ▼                    │
                    ┌──────────────┐             │
                    │ Event Bus    │             │
                    │ (Redis/RMQ)  │◄────────────┘
                    └──────────────┘
```

### Communication Patterns

- **Synchronous**: Client → API Gateway → Services (REST APIs)
- **Asynchronous**: Service ↔ Event Bus ↔ Service (Pub/Sub)
- **Blockchain**: Critical transactions recorded to blockchain for immutability

## 🛠️ Tech Stack

### Core Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | Express.js | 4.x |
| API Gateway | Express + http-proxy-middleware | Latest |
| Event Bus (Phase 1) | Redis | 7.x |
| Event Bus (Phase 2) | RabbitMQ | 3.12.x |
| Containerization | Docker + Docker Compose | Latest |

### Databases

| Service   | Database    | Driver    | Reason                                            |
|---------  |----------   |--------   |--------                                           |
| Auth      | MongoDB     | Mongoose  | Flexible user schemas, auth providers             |
| Product   | MongoDB     | Mongoose  | Varying product attributes, nested categories     |
| Comments  | MongoDB     | Mongoose  | Nested replies, document-oriented                 |
| Payment   | PostgreSQL  | pg        | ACID compliance, financial data integrity         |
| Order     | PostgreSQL  | pg        | Complex relationships, transactional consistency  |

### Supporting Tools

- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## 🔧 Services

### 1. Auth Service (Port 3001)

**Responsibilities**:
- User registration and authentication
- JWT token generation and validation
- Password management
- User profile management

**Database**: MongoDB (`auth_db`)

**Events Published**:
- `user.created`
- `user.updated`
- `user.deleted`

**Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/verify` - Token validation
- `GET /api/auth/profile` - User profile

---

### 2. Product Service (Port 3002)

**Responsibilities**:
- Product catalog management (CRUD)
- Inventory tracking
- Category management
- Product search and filtering

**Database**: MongoDB (`product_db`)

**Events Published**:
- `product.created`
- `product.updated`
- `product.deleted`
- `product.inventory.low`

**Events Consumed**:
- `order.completed` → Update inventory

**Endpoints**:
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

---

### 3. Comments Service (Port 3003)

**Responsibilities**:
- Product reviews and comments
- Nested comment replies
- Comment moderation
- Rating aggregation

**Database**: MongoDB (`comments_db`)

**Events Published**:
- `comment.created`
- `comment.updated`
- `comment.deleted`
- `comment.flagged`

**Events Consumed**:
- `product.deleted` → Remove product comments
- `user.deleted` → Handle user comment cleanup

**Endpoints**:
- `GET /api/comments/product/:productId` - Get product comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

---

### 4. Payment Service (Port 3004)

**Responsibilities**:
- Payment processing (mock gateway)
- Transaction management
- Payment status tracking
- Blockchain transaction recording

**Database**: PostgreSQL (`payment_db`)

**Events Published**:
- `payment.initiated`
- `payment.completed`
- `payment.failed`
- `payment.refunded`

**Events Consumed**:
- `order.created` → Initiate payment

**Endpoints**:
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/:id` - Get payment status
- `GET /api/payments/order/:orderId` - Get order payments
- `POST /api/payments/:id/refund` - Refund payment

**Blockchain Integration**:
- All completed payments recorded to blockchain
- Immutable transaction history
- Transparent audit trail

---

### 5. Order Service (Port 3005)

**Responsibilities**:
- Order creation and management
- Order status tracking
- Order history
- Saga orchestration for order flow

**Database**: PostgreSQL (`order_db`)

**Events Published**:
- `order.created`
- `order.confirmed`
- `order.completed`
- `order.cancelled`
- `order.failed`

**Events Consumed**:
- `payment.completed` → Confirm order
- `payment.failed` → Cancel order

**Endpoints**:
- `POST /api/orders` - Create order
- `GET /api/orders` - List user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order

**Blockchain Integration**:
- Confirmed orders written to blockchain
- Order state transitions recorded
- Immutable order history

---

### 6. API Gateway (Port 3000)

**Responsibilities**:
- Request routing to services
- JWT authentication
- Rate limiting
- Request/response logging
- CORS handling

**Features**:
- Routes all `/api/*` requests to appropriate services
- Validates JWT tokens before forwarding
- Implements rate limiting per user/IP
- Centralized error handling
- Health check aggregation

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ecommerce-microservices.git
cd ecommerce-microservices
```

2. **Install dependencies**

```bash
# Install dependencies for all services
npm run install:all

# Or install individually
cd services/auth && npm install
cd services/product && npm install
# ... repeat for other services
```

3. **Set up environment variables**

```bash
# Copy example env files
cp services/auth/.env.example services/auth/.env
cp services/product/.env.example services/product/.env
cp services/comments/.env.example services/comments/.env
cp services/payment/.env.example services/payment/.env
cp services/order/.env.example services/order/.env
cp gateway/.env.example gateway/.env

# Edit each .env file with your configuration
```

4. **Start the application**

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start in development mode
docker-compose -f docker-compose.dev.yml up
```

5. **Verify services are running**

```bash
# Check health endpoints
curl http://localhost:3000/health        # API Gateway
curl http://localhost:3001/health        # Auth Service
curl http://localhost:3002/health        # Product Service
curl http://localhost:3003/health        # Comments Service
curl http://localhost:3004/health        # Payment Service
curl http://localhost:3005/health        # Order Service
```

### Quick Start with Sample Data

```bash
# Seed databases with sample data
npm run seed

# Create a test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

## 💻 Development

### Project Structure

```
ecommerce-microservices/
├── services/
│   ├── auth/
│   │   ├── src/
│   │   │   ├── config/         # DB, environment configuration
│   │   │   ├── controllers/    # Route handlers
│   │   │   ├── models/         # Mongoose models
│   │   │   ├── routes/         # Express routes
│   │   │   ├── services/       # Business logic
│   │   │   ├── events/         # Event publishers/subscribers
│   │   │   ├── middleware/     # Auth, validation, error handling
│   │   │   └── index.js        # Entry point
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── .env.example
│   ├── product/
│   ├── comments/
│   ├── payment/
│   └── order/
├── gateway/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── common/                      # Shared code
│   ├── events/                  # Event schemas, utilities
│   ├── middleware/              # Shared middleware
│   ├── utils/                   # Helper functions
│   └── types/                   # TypeScript types (optional)
├── blockchain/                  # Blockchain integration
│   ├── contracts/              # Smart contracts
│   └── scripts/                # Deployment scripts
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Development compose
├── package.json                # Root package.json
└── README.md
```

### Development Commands

```bash
# Start all services in development mode
npm run dev

# Start individual service
npm run dev:auth
npm run dev:product
npm run dev:comments
npm run dev:payment
npm run dev:order
npm run dev:gateway

# Run tests
npm test                        # All services
npm run test:auth              # Individual service
npm run test:integration       # Integration tests

# Linting and formatting
npm run lint                   # Check code style
npm run lint:fix              # Fix code style issues
npm run format                # Format code with Prettier

# Database operations
npm run migrate               # Run database migrations
npm run seed                  # Seed databases
npm run db:reset              # Reset all databases

# Docker operations
npm run docker:build          # Build all images
npm run docker:up             # Start containers
npm run docker:down           # Stop containers
npm run docker:logs           # View logs
```

### Environment Variables

Each service requires the following environment variables:

**Auth Service (.env)**
```env
PORT=3001
NODE_ENV=development
DB_HOST=mongodb
DB_PORT=27017
DB_NAME=auth_db
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=24h
```

**Product Service (.env)**
```env
PORT=3002
NODE_ENV=development
DB_HOST=mongodb
DB_PORT=27017
DB_NAME=product_db
REDIS_HOST=redis
REDIS_PORT=6379
```

**Payment Service (.env)**
```env
PORT=3004
NODE_ENV=development
DB_HOST=postgres
DB_PORT=5432
DB_NAME=payment_db
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_HOST=redis
REDIS_PORT=6379
BLOCKCHAIN_RPC_URL=http://blockchain:8545
```

*See individual `.env.example` files for complete configurations.*

## 📚 API Documentation

### Authentication

All API requests (except auth endpoints) require JWT authentication:

```bash
# Include JWT token in Authorization header
Authorization: Bearer <your-jwt-token>
```

### Sample API Flows

**1. User Registration and Login**

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword"
  }'
```

**2. Create Product (Admin)**

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 1299.99,
    "inventory": 50,
    "category": "electronics"
  }'
```

**3. Complete Order Flow**

```bash
# 1. Create order
ORDER_RESPONSE=$(curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "product-id-123", "quantity": 2}
    ]
  }')

# 2. Payment is automatically initiated (event-driven)
# 3. Payment completion triggers order confirmation
# 4. Order confirmation triggers inventory update
# 5. Transaction recorded to blockchain
```

### Postman Collection

Import the Postman collection for complete API documentation:
- [Download Collection](./docs/postman/collection.json)

## 📡 Event System

### Event-Driven Architecture

Services communicate asynchronously through an event bus (Redis/RabbitMQ) using the Pub/Sub pattern.

### Event Structure

All events follow a standardized structure:

```json
{
  "eventId": "uuid-v4",
  "eventType": "order.created",
  "timestamp": "2024-01-29T10:30:00Z",
  "version": "1.0",
  "source": "order-service",
  "data": {
    "orderId": "order-123",
    "userId": "user-456",
    "totalAmount": 299.99
  },
  "metadata": {
    "correlationId": "correlation-uuid",
    "causationId": "parent-event-uuid"
  }
}
```

### Key Event Flows

**Order Saga (Choreography Pattern)**

```
1. User creates order
   ↓
2. Order Service → publishes: order.created
   ↓
3. Payment Service → consumes: order.created
   ↓
4. Payment Service → publishes: payment.initiated
   ↓
5. Payment Service → publishes: payment.completed
   ↓
6. Order Service → consumes: payment.completed
   ↓
7. Order Service → publishes: order.confirmed
   ↓
8. Product Service → consumes: order.confirmed
   ↓
9. Product Service → updates inventory
   ↓
10. Blockchain Service → records transaction
```

### Event Categories

| Event Type | Publisher | Consumers | Purpose |
|------------|-----------|-----------|---------|
| `user.created` | Auth | Order, Payment | User account setup |
| `product.created` | Product | - | Product catalog update |
| `product.inventory.low` | Product | Admin notifications | Inventory alerts |
| `order.created` | Order | Payment | Initiate payment |
| `payment.completed` | Payment | Order, Blockchain | Confirm order |
| `order.confirmed` | Order | Product, Blockchain | Update inventory |
| `comment.created` | Comments | Product | Update ratings |

### Migration: Redis → RabbitMQ

**Phase 1: Redis Pub/Sub** (Current)
- Simple setup
- Fire-and-forget messaging
- Good for learning event patterns

**Phase 2: RabbitMQ** (Planned)
- Message persistence
- Guaranteed delivery
- Dead letter queues
- Complex routing patterns

**Migration Strategy**:
1. Abstract event bus behind interface
2. Implement RabbitMQ adapter
3. Run both systems in parallel
4. Gradually migrate services
5. Remove Redis pub/sub

## ⛓️ Blockchain Integration

### Overview

Critical business transactions are recorded to a blockchain for:
- **Immutability**: Transaction history cannot be altered
- **Transparency**: Audit trail for compliance
- **Trust**: Verifiable transaction records

### Blockchain Architecture

```
┌─────────────────┐
│  Payment/Order  │
│    Services     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Blockchain    │
│     Adapter     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Smart Contract │
│  (Transaction)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Blockchain Net │
│  (Ethereum/BSC) │
└─────────────────┘
```

### What Gets Recorded

1. **Payment Transactions**
   - Payment ID
   - Order ID
   - Amount
   - Timestamp
   - Status

2. **Order Confirmations**
   - Order ID
   - User ID
   - Items hash
   - Total amount
   - Timestamp

3. **State Transitions**
   - Order status changes
   - Payment status changes

### Blockchain Technology

- **Network**: Ethereum testnet (Goerli/Sepolia) or BSC testnet
- **Smart Contract**: Solidity
- **Interaction**: ethers.js / web3.js
- **Cost**: Gas fees paid from service wallet

### Querying Blockchain Data

```bash
# Get transaction by order ID
GET /api/blockchain/order/:orderId

# Get payment transaction
GET /api/blockchain/payment/:paymentId

# Verify transaction
GET /api/blockchain/verify/:transactionHash
```

### Benefits for Interviews

- Demonstrates understanding of distributed ledger technology
- Shows real-world blockchain application
- Adds unique differentiator to standard e-commerce projects
- Discusses trade-offs (cost, speed, immutability)

## 🚢 Deployment

### Digital Ocean Deployment

**Option 1: Docker Compose (Simpler)**

1. Create Digital Ocean Droplet (Ubuntu 22.04, 4GB RAM minimum)
2. Install Docker and Docker Compose
3. Clone repository
4. Set production environment variables
5. Run `docker-compose up -d`

**Option 2: Kubernetes (Advanced)**

1. Create Digital Ocean Kubernetes cluster
2. Configure kubectl
3. Apply Kubernetes manifests
4. Set up Ingress controller
5. Configure SSL certificates

### Environment Configuration

**Production Environment Variables**:
```env
NODE_ENV=production
DB_HOST=<managed-database-host>
REDIS_HOST=<managed-redis-host>
JWT_SECRET=<strong-production-secret>
# ... other production configs
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Digital Ocean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to DO
        # ... deployment steps
```

### Monitoring and Logging

**Recommended Stack**:
- **Logging**: Winston → Elasticsearch → Kibana (ELK)
- **Metrics**: Prometheus + Grafana
- **Tracing**: Jaeger for distributed tracing
- **APM**: New Relic or Datadog (optional)

### Health Checks and Monitoring

Each service exposes:
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `GET /metrics` - Prometheus metrics

## 🧪 Testing

### Testing Strategy

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test service endpoints
3. **Event Tests**: Test event publishing and consumption
4. **End-to-End Tests**: Test complete user flows
5. **Contract Tests**: Test service boundaries

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode
npm run test:watch
```

### Test Structure

```javascript
// services/order/tests/integration/order.test.js
describe('Order Service', () => {
  describe('POST /api/orders', () => {
    it('should create order and publish event', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(orderData);
      
      expect(response.status).toBe(201);
      expect(response.body.orderId).toBeDefined();
      // Verify event was published
    });
  });
});
```

### Coverage Goals

- Unit Tests: >80% coverage
- Integration Tests: Critical paths covered
- E2E Tests: Main user journeys

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards

- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Follow conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGithub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Inspired by real-world microservices architectures
- Event-driven patterns from enterprise systems
- Blockchain integration patterns from DeFi applications

## 📞 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ecommerce-microservices/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ecommerce-microservices/discussions)

---

**Built with ❤️ for learning and demonstrating microservices architecture**
