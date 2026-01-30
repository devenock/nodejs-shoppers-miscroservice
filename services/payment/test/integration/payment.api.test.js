process.env.TEST = '1';
process.env.DB_NAME = process.env.DB_NAME || 'postgres';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupTestDb, clearPayments, teardownTestDb } = require('../helpers/setup');

describe('Payment API', () => {
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
    await clearPayments();
    app = require('../../dist/app').default;
  });

  after(async () => {
    await teardownTestDb();
  });

  describe('POST /api/payments/initiate', () => {
    it('returns 201 and payment with auth', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orderId: 'order-1', amount: 99.99 })
        .expect(201);
      assert.ok(res.body.id);
      assert.strictEqual(res.body.order_id, 'order-1');
      assert.strictEqual(res.body.status, 'processing');
    });

    it('returns 401 without token', async () => {
      await request(app).post('/api/payments/initiate').send({ orderId: 'o2', amount: 10 }).expect(401);
    });

    it('returns 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orderId: '', amount: -1 })
        .expect(400);
      assert.ok(res.body.error);
    });
  });

  describe('GET /api/payments/:id', () => {
    it('returns 200 and payment', async () => {
      const create = await request(app)
        .post('/api/payments/initiate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ orderId: 'order-get', amount: 50 })
        .expect(201);
      const res = await request(app)
        .get(`/api/payments/${create.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      assert.strictEqual(res.body.order_id, 'order-get');
    });

    it('returns 404 for invalid id', async () => {
      await request(app)
        .get('/api/payments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/payments/order/:orderId', () => {
    it('returns 200 with payments array', async () => {
      const res = await request(app)
        .get('/api/payments/order/order-get')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      assert.ok(Array.isArray(res.body.payments));
    });
  });

  describe('GET /health', () => {
    it('returns 200', async () => {
      await request(app).get('/health').expect(200);
    });
  });
});
