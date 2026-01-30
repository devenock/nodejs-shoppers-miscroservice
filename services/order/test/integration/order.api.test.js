process.env.TEST = '1';
process.env.DB_NAME = process.env.DB_NAME || 'postgres';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupTestDb, clearOrders, teardownTestDb } = require('../helpers/setup');

describe('Order API', () => {
  let app;
  let authToken;

  before(async () => {
    setupTestDb();
    authToken = jwt.sign({ userId: 'user-1', email: 'u@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const { connect, initSchema } = require('../../dist/config/database');
    await connect();
    await initSchema();
    const { connect: connectRedis } = require('../../dist/config/redis');
    await connectRedis();
    await clearOrders();
    app = require('../../dist/app').default;
  });

  after(async () => {
    await teardownTestDb();
  });

  describe('POST /api/orders', () => {
    it('returns 201 and order with auth', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ productId: 'p1', quantity: 2, price: 10 }, { productId: 'p2', quantity: 1, price: 5 }],
          totalAmount: 25,
        })
        .expect(201);
      assert.ok(res.body.id);
      assert.strictEqual(res.body.status, 'pending');
      assert.strictEqual(res.body.user_id, 'user-1');
      assert.strictEqual(res.body.items.length, 2);
    });

    it('returns 401 without token', async () => {
      await request(app).post('/api/orders').send({ items: [{ productId: 'p1', quantity: 1 }], totalAmount: 10 }).expect(401);
    });

    it('returns 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [], totalAmount: -1 })
        .expect(400);
      assert.ok(res.body.error);
    });
  });

  describe('GET /api/orders', () => {
    it('returns 200 with orders array', async () => {
      const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${authToken}`).expect(200);
      assert.ok(Array.isArray(res.body.orders));
      assert.ok(typeof res.body.total === 'number');
    });
  });

  describe('GET /api/orders/:id', () => {
    it('returns 200 and order', async () => {
      const create = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [{ productId: 'p1', quantity: 1, price: 9 }], totalAmount: 9 })
        .expect(201);
      const res = await request(app)
        .get(`/api/orders/${create.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      assert.strictEqual(res.body.id, create.body.id);
    });

    it('returns 404 for invalid id', async () => {
      await request(app)
        .get('/api/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    it('returns 200 and cancelled order', async () => {
      const create = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [{ productId: 'p1', quantity: 1, price: 1 }], totalAmount: 1 })
        .expect(201);
      const res = await request(app)
        .put(`/api/orders/${create.body.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      assert.strictEqual(res.body.status, 'cancelled');
    });
  });

  describe('GET /health', () => {
    it('returns 200', async () => {
      await request(app).get('/health').expect(200);
    });
  });
});
