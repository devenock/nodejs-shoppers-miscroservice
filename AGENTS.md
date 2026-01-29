# AGENTS.md - AI Agent Collaboration Strategy

This document defines how AI coding agents (Claude, GitHub Copilot, Cursor, etc.) should approach and assist with this microservices project. It serves as a contract between human developers and AI assistants to ensure consistent, high-quality code generation and architectural decisions.

## 📋 Table of Contents

- [Project Context](#project-context)
- [Agent Roles and Responsibilities](#agent-roles-and-responsibilities)
- [Code Generation Guidelines](#code-generation-guidelines)
- [Architectural Constraints](#architectural-constraints)
- [Service-Specific Guidelines](#service-specific-guidelines)
- [Event System Rules](#event-system-rules)
- [Database Guidelines](#database-guidelines)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)

## 🎯 Project Context

### Project Type
Event-driven microservices e-commerce backend with blockchain integration

### Technology Stack
- **Runtime**: Node.js 20.x LTS
- **Framework**: Express.js
- **Databases**: MongoDB (Auth, Product, Comments), PostgreSQL (Payment, Order)
- **Event Bus**: Redis (migrating to RabbitMQ)
- **Containerization**: Docker + Docker Compose
- **Authentication**: JWT

### Architecture Pattern
- Microservices with clear domain boundaries
- Event-driven communication (Pub/Sub)
- Saga pattern for distributed transactions
- API Gateway for routing and authentication
- Polyglot persistence

### Key Constraints
- Each service must be independently deployable
- No direct database access across services
- Communication via events or API calls only
- Idempotent event handlers
- Graceful degradation when services are unavailable

## 🤖 Agent Roles and Responsibilities

### When Acting as Service Developer

**Primary Responsibilities**:
1. Generate complete, working service implementations
2. Follow service-specific patterns and conventions
3. Implement event publishers and subscribers correctly
4. Write comprehensive error handling
5. Include input validation for all endpoints
6. Generate appropriate tests

**Secondary Responsibilities**:
1. Document API endpoints with examples
2. Create database schemas/models
3. Implement middleware (auth, logging, validation)
4. Set up health check endpoints
5. Configure environment variables

### When Acting as Architect

**Primary Responsibilities**:
1. Ensure service boundaries are correct
2. Validate event flow designs
3. Recommend appropriate database for use case
4. Identify potential race conditions or consistency issues
5. Suggest scalability improvements

**Secondary Responsibilities**:
1. Review service-to-service communication patterns
2. Validate saga implementations
3. Identify circular dependencies
4. Recommend caching strategies

### When Acting as DevOps Assistant

**Primary Responsibilities**:
1. Generate Dockerfile for services
2. Create Docker Compose configurations
3. Set up environment variable templates
4. Configure health checks and readiness probes

**Secondary Responsibilities**:
1. Suggest monitoring and logging strategies
2. Recommend deployment approaches
3. Create database migration scripts

## 📝 Code Generation Guidelines

### General Principles

1. **Explicit Over Implicit**: Always be explicit about types, dependencies, and configurations
2. **Error-First**: Handle errors before happy path
3. **Single Responsibility**: Each function/module has one clear purpose
4. **DRY (Don't Repeat Yourself)**: Extract common logic into utilities
5. **Fail Fast**: Validate inputs early and fail with clear error messages

### File Structure Convention

When generating code for a service, follow this structure:

```
services/{service-name}/
├── src/
│   ├── config/
│   │   ├── database.js          # Database connection
│   │   ├── redis.js             # Redis/event bus connection
│   │   └── env.js               # Environment variables
│   ├── models/                  # Database models (Mongoose/Sequelize)
│   │   └── {Model}.js
│   ├── controllers/             # Route handlers
│   │   └── {resource}.controller.js
│   ├── services/                # Business logic
│   │   └── {resource}.service.js
│   ├── routes/                  # Express routes
│   │   └── {resource}.routes.js
│   ├── events/                  # Event publishers/subscribers
│   │   ├── publishers.js
│   │   └── subscribers.js
│   ├── middleware/              # Express middleware
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── utils/                   # Helper functions
│   │   ├── logger.js
│   │   └── validators.js
│   └── index.js                 # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
├── Dockerfile
├── .env.example
├── .eslintrc.js
└── package.json
```

### Code Style

**JavaScript/Node.js Conventions**:

```javascript
// ✅ GOOD: Async/await with proper error handling
async function createOrder(orderData) {
  try {
    // Validate input
    const validatedData = await validateOrderData(orderData);
    
    // Business logic
    const order = await Order.create(validatedData);
    
    // Publish event
    await publishEvent('order.created', {
      orderId: order.id,
      userId: order.userId,
      totalAmount: order.totalAmount
    });
    
    return order;
  } catch (error) {
    logger.error('Failed to create order', { error, orderData });
    throw new OrderCreationError(error.message);
  }
}

// ❌ BAD: Callback hell, no error handling
function createOrder(orderData, callback) {
  Order.create(orderData, function(err, order) {
    if (err) callback(err);
    publishEvent('order.created', order, function(err) {
      callback(null, order);
    });
  });
}
```

**Error Handling Pattern**:

```javascript
// Custom error classes
class ApplicationError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

class ValidationError extends ApplicationError {
  constructor(message) {
    super(message, 400);
  }
}

class NotFoundError extends ApplicationError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

// Global error handler middleware
function errorHandler(err, req, res, next) {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({
      error: err.message,
      type: err.name
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    type: 'InternalError'
  });
}
```

**Validation Pattern**:

```javascript
// Use Joi for validation
const Joi = require('joi');

const orderSchema = Joi.object({
  userId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    zipCode: Joi.string().required()
  }).required()
});

// Validation middleware
function validateOrder(req, res, next) {
  const { error, value } = orderSchema.validate(req.body);
  
  if (error) {
    return next(new ValidationError(error.details[0].message));
  }
  
  req.validatedData = value;
  next();
}
```

### Logging Pattern

```javascript
// Use Winston for structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: process.env.SERVICE_NAME },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Usage
logger.info('Order created', { orderId: order.id, userId: user.id });
logger.error('Payment failed', { error: err.message, orderId: order.id });
logger.warn('Low inventory', { productId: product.id, remaining: 5 });
```

## 🏗️ Architectural Constraints

### Service Communication Rules

**✅ ALLOWED**:
1. Service → Event Bus → Service (via events)
2. API Gateway → Service (authenticated requests)
3. Service → External API (third-party integrations)
4. Service → Own Database

**❌ FORBIDDEN**:
1. Service → Another Service's Database (direct access)
2. Service → Service (synchronous HTTP calls, except specific cases)
3. Shared database between services
4. Service reading another service's events without proper subscription

### Event-Driven Rules

1. **Idempotency**: All event handlers MUST be idempotent
   ```javascript
   // ✅ GOOD: Check if already processed
   async function handleOrderCreated(event) {
     const { orderId } = event.data;
     
     // Check if already processed
     const existing = await Payment.findOne({ orderId });
     if (existing) {
       logger.info('Payment already exists for order', { orderId });
       return;
     }
     
     // Process payment
     await processPayment(event.data);
   }
   ```

2. **Event Schema**: All events must follow standard schema
   ```javascript
   {
     eventId: 'uuid-v4',
     eventType: 'order.created',
     timestamp: 'ISO-8601',
     version: '1.0',
     source: 'order-service',
     data: { /* event payload */ },
     metadata: {
       correlationId: 'uuid',
       causationId: 'parent-event-id'
     }
   }
   ```

3. **Event Versioning**: Include version in event type
   ```javascript
   // When event structure changes
   'order.created.v1' → 'order.created.v2'
   
   // Handle both versions during migration
   async function handleOrderCreated(event) {
     if (event.version === '1.0') {
       return handleV1(event);
     }
     return handleV2(event);
   }
   ```

4. **Correlation IDs**: Always propagate correlation IDs
   ```javascript
   async function publishEvent(eventType, data, metadata = {}) {
     const event = {
       eventId: uuidv4(),
       eventType,
       timestamp: new Date().toISOString(),
       version: '1.0',
       source: process.env.SERVICE_NAME,
       data,
       metadata: {
         correlationId: metadata.correlationId || uuidv4(),
         causationId: metadata.causationId || null
       }
     };
     
     await eventBus.publish(eventType, event);
     logger.info('Event published', { eventType, eventId: event.eventId });
   }
   ```

### Database Constraints

**MongoDB Services (Auth, Product, Comments)**:
```javascript
// ✅ GOOD: Use Mongoose for schema validation
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  inventory: { type: Number, required: true, default: 0 },
  category: { type: String, required: true, index: true },
  metadata: { type: Map, of: String }, // Flexible metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes for common queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search

module.exports = mongoose.model('Product', productSchema);
```

**PostgreSQL Services (Payment, Order)**:
```javascript
// ✅ GOOD: Use native pg with proper connection pooling
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 2000
});

// ✅ GOOD: Use transactions for consistency
async function createOrderWithItems(orderData) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert order
    const orderResult = await client.query(
      'INSERT INTO orders(user_id, total_amount, status) VALUES($1, $2, $3) RETURNING *',
      [orderData.userId, orderData.totalAmount, 'pending']
    );
    const order = orderResult.rows[0];
    
    // Insert order items
    for (const item of orderData.items) {
      await client.query(
        'INSERT INTO order_items(order_id, product_id, quantity, price) VALUES($1, $2, $3, $4)',
        [order.id, item.productId, item.quantity, item.price]
      );
    }
    
    await client.query('COMMIT');
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Authentication Pattern

**JWT Validation in Services**:
```javascript
// Middleware to verify JWT
const jwt = require('jsonwebtoken');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    logger.warn('Invalid token', { error: error.message });
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Usage in routes
router.post('/orders', authenticateToken, createOrder);
```

## 🔧 Service-Specific Guidelines

### Auth Service

**Requirements**:
- Password hashing with bcrypt (min 10 rounds)
- JWT token generation with expiry
- Token refresh mechanism
- Rate limiting on login attempts
- Email validation

**Example**:
```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function registerUser(userData) {
  // Validate email
  if (!isValidEmail(userData.email)) {
    throw new ValidationError('Invalid email format');
  }
  
  // Check if user exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ValidationError('Email already registered');
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  // Create user
  const user = await User.create({
    email: userData.email,
    password: hashedPassword,
    name: userData.name
  });
  
  // Publish event
  await publishEvent('user.created', {
    userId: user.id,
    email: user.email,
    name: user.name
  });
  
  // Generate token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY }
  );
  
  return { user: user.toPublic(), token };
}
```

### Product Service

**Requirements**:
- Inventory tracking with optimistic locking
- Low inventory alerts (event when < threshold)
- Product search with text indexing
- Category hierarchy support

**Example**:
```javascript
async function reduceInventory(productId, quantity) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const product = await Product.findById(productId).session(session);
    
    if (!product) {
      throw new NotFoundError('Product');
    }
    
    if (product.inventory < quantity) {
      throw new ValidationError('Insufficient inventory');
    }
    
    product.inventory -= quantity;
    await product.save({ session });
    
    // Check low inventory threshold
    if (product.inventory < 10) {
      await publishEvent('product.inventory.low', {
        productId: product.id,
        remainingInventory: product.inventory
      });
    }
    
    await session.commitTransaction();
    return product;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

### Payment Service

**Requirements**:
- Transaction idempotency keys
- Payment status state machine
- Blockchain recording for completed payments
- Refund support

**States**: `initiated` → `processing` → `completed` | `failed`

### Order Service

**Requirements**:
- Order saga orchestration
- Order status state machine
- Link to payment and products
- Support for order cancellation

**States**: `pending` → `confirmed` → `processing` → `completed` | `cancelled`

### Comments Service

**Requirements**:
- Nested comment support (replies)
- Product association
- User association
- Moderation flags

## 📡 Event System Rules

### Event Naming Convention

Format: `{resource}.{action}[.{detail}]`

Examples:
- `user.created`
- `order.confirmed`
- `product.inventory.low`
- `payment.failed`

### Event Publisher Template

```javascript
const EventEmitter = require('events');
const redis = require('./config/redis');
const logger = require('./utils/logger');

class EventPublisher {
  constructor() {
    this.redisClient = redis;
  }
  
  async publish(eventType, data, metadata = {}) {
    const event = {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      version: '1.0',
      source: process.env.SERVICE_NAME,
      data,
      metadata: {
        correlationId: metadata.correlationId || this.generateEventId(),
        causationId: metadata.causationId || null
      }
    };
    
    try {
      await this.redisClient.publish(eventType, JSON.stringify(event));
      logger.info('Event published', {
        eventType,
        eventId: event.eventId,
        correlationId: event.metadata.correlationId
      });
      return event;
    } catch (error) {
      logger.error('Failed to publish event', {
        eventType,
        error: error.message
      });
      throw error;
    }
  }
  
  generateEventId() {
    return require('crypto').randomUUID();
  }
}

module.exports = new EventPublisher();
```

### Event Subscriber Template

```javascript
const redis = require('./config/redis');
const logger = require('./utils/logger');

class EventSubscriber {
  constructor() {
    this.subscriber = redis.duplicate();
    this.handlers = new Map();
  }
  
  async subscribe(eventType, handler) {
    this.handlers.set(eventType, handler);
    await this.subscriber.subscribe(eventType);
    
    logger.info('Subscribed to event', { eventType });
  }
  
  async start() {
    this.subscriber.on('message', async (channel, message) => {
      try {
        const event = JSON.parse(message);
        const handler = this.handlers.get(channel);
        
        if (handler) {
          logger.info('Processing event', {
            eventType: channel,
            eventId: event.eventId
          });
          
          await handler(event);
          
          logger.info('Event processed successfully', {
            eventType: channel,
            eventId: event.eventId
          });
        }
      } catch (error) {
        logger.error('Error processing event', {
          eventType: channel,
          error: error.message,
          stack: error.stack
        });
        // In production: send to dead letter queue
      }
    });
  }
}

module.exports = new EventSubscriber();
```

## 🧪 Testing Requirements

### Test Coverage Requirements

- **Unit Tests**: >80% coverage for business logic
- **Integration Tests**: All API endpoints
- **Event Tests**: All event publishers and subscribers
- **E2E Tests**: Critical user flows

### Test Structure

```javascript
// services/order/tests/integration/order.test.js
const request = require('supertest');
const app = require('../../src/index');
const { setupTestDB, cleanupTestDB } = require('../helpers/db');
const { generateToken } = require('../helpers/auth');

describe('Order Service - Integration Tests', () => {
  let authToken;
  
  beforeAll(async () => {
    await setupTestDB();
    authToken = generateToken({ userId: 'test-user-123' });
  });
  
  afterAll(async () => {
    await cleanupTestDB();
  });
  
  describe('POST /api/orders', () => {
    it('should create order and publish event', async () => {
      const orderData = {
        items: [
          { productId: 'product-123', quantity: 2 }
        ]
      };
      
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);
      
      expect(response.body).toHaveProperty('orderId');
      expect(response.body.status).toBe('pending');
      
      // Verify event was published (mock or check event bus)
    });
    
    it('should return 401 without auth token', async () => {
      await request(app)
        .post('/api/orders')
        .send({})
        .expect(401);
    });
  });
});
```

## 📚 Documentation Standards

### Code Comments

```javascript
/**
 * Creates a new order and initiates the order saga
 * 
 * @param {Object} orderData - Order creation data
 * @param {string} orderData.userId - User ID
 * @param {Array} orderData.items - Array of order items
 * @param {Object} orderData.shippingAddress - Shipping address
 * @returns {Promise<Object>} Created order object
 * @throws {ValidationError} If order data is invalid
 * @throws {OrderCreationError} If order creation fails
 * 
 * @emits order.created - When order is successfully created
 */
async function createOrder(orderData) {
  // Implementation
}
```

### API Documentation

Use JSDoc comments for API endpoints:

```javascript
/**
 * @route POST /api/orders
 * @group Orders - Order management
 * @param {OrderCreateRequest.model} body.body.required - Order data
 * @returns {OrderResponse.model} 201 - Order created successfully
 * @returns {ValidationError.model} 400 - Invalid request data
 * @returns {UnauthorizedError.model} 401 - Missing or invalid token
 * @security JWT
 */
router.post('/orders', authenticateToken, validateOrder, createOrder);
```

### README for Each Service

Each service should have its own README:

```markdown
# Order Service

## Overview
Manages order creation, tracking, and saga orchestration.

## Environment Variables
- `PORT` - Service port (default: 3005)
- `DB_HOST` - PostgreSQL host
- `DB_NAME` - Database name
...

## API Endpoints
### POST /api/orders
Creates a new order
...

## Events
### Published
- `order.created`
- `order.confirmed`
...

### Consumed
- `payment.completed`
...

## Running Locally
```bash
npm install
npm run dev
```
```

## 🎓 Agent Learning Points

When working on this project, AI agents should understand and demonstrate:

1. **Microservices Patterns**:
   - Service decomposition by business capability
   - API Gateway pattern
   - Saga pattern for distributed transactions
   - Event sourcing concepts

2. **Event-Driven Architecture**:
   - Pub/Sub messaging
   - Event versioning and schema evolution
   - Eventual consistency
   - Idempotency

3. **Database Design**:
   - Choosing the right database for the use case
   - Database per service pattern
   - Transaction management in distributed systems

4. **System Design Trade-offs**:
   - CAP theorem implications
   - Consistency vs Availability
   - Synchronous vs Asynchronous communication
   - Latency vs Throughput

5. **Production Concerns**:
   - Error handling and recovery
   - Logging and monitoring
   - Health checks and graceful shutdown
   - Security best practices

## 🚨 Common Pitfalls to Avoid

### ❌ Don't Do This

1. **Shared Database**:
   ```javascript
   // BAD: Order service accessing Product database directly
   const product = await ProductModel.findById(productId);
   ```
   
   **Instead**: Use events or API calls
   ```javascript
   // GOOD: Publish event or call Product service API
   await publishEvent('product.get', { productId });
   ```

2. **Synchronous Service Calls**:
   ```javascript
   // BAD: Direct HTTP call between services
   const response = await axios.get('http://product-service:3002/products/123');
   ```
   
   **Instead**: Use events for most communication
   ```javascript
   // GOOD: Event-driven
   await publishEvent('order.requires.product', { productId: '123' });
   ```

3. **Missing Idempotency**:
   ```javascript
   // BAD: Processing event without checking if already done
   async function handlePaymentCompleted(event) {
     await Order.update({ id: event.orderId }, { status: 'confirmed' });
   }
   ```
   
   **Instead**: Check before processing
   ```javascript
   // GOOD: Idempotent handler
   async function handlePaymentCompleted(event) {
     const order = await Order.findById(event.orderId);
     if (order.status === 'confirmed') return; // Already processed
     
     await Order.update({ id: event.orderId }, { status: 'confirmed' });
   }
   ```

## 📞 Questions for Agents to Ask

Before generating code, agents should consider:

1. "Which service does this belong to?"
2. "Should this be synchronous or asynchronous?"
3. "What events should be published?"
4. "Is this handler idempotent?"
5. "What happens if this service is down?"
6. "How do I test this in isolation?"
7. "What are the error scenarios?"

---

**Last Updated**: 2024-01-29
**Version**: 1.0
**Maintained By**: Project maintainers

This document evolves with the project. Update it as architectural decisions change.
