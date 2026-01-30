const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupTestDb, clearCollections, teardownTestDb } = require('../helpers/setup');

describe('Product API', () => {
  let app;
  let authToken;

  before(async () => {
    setupTestDb();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    authToken = jwt.sign({ userId: 'test-user', email: 'test@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const { connect } = require('../../src/config/database');
    await connect();
    const { connect: connectRedis } = require('../../src/config/redis');
    await connectRedis();
    await clearCollections();
    app = require('../../src/app');
  });

  after(async () => {
    await teardownTestDb();
  });

  describe('GET /api/products', () => {
    it('returns 200 with empty list', async () => {
      const res = await request(app).get('/api/products').expect(200);
      assert.strictEqual(res.body.products.length, 0);
      assert.strictEqual(res.body.total, 0);
    });
  });

  describe('POST /api/products', () => {
    it('returns 201 and product with valid body and auth', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Widget', description: 'A widget', price: 9.99, inventory: 100, category: 'tools' })
        .expect(201);
      assert.strictEqual(res.body.name, 'Widget');
      assert.strictEqual(res.body.inventory, 100);
      assert.ok(res.body._id);
    });

    it('returns 401 without token', async () => {
      await request(app)
        .post('/api/products')
        .send({ name: 'X', price: 1, inventory: 0, category: 'y' })
        .expect(401);
    });

    it('returns 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '', price: -1, inventory: 0, category: 'y' })
        .expect(400);
      assert.ok(res.body.error);
    });
  });

  describe('GET /api/products/:id', () => {
    it('returns 200 and product', async () => {
      const create = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Item', description: '', price: 5, inventory: 10, category: 'cat' })
        .expect(201);
      const res = await request(app).get(`/api/products/${create.body._id}`).expect(200);
      assert.strictEqual(res.body.name, 'Item');
    });

    it('returns 404 for invalid id', async () => {
      await request(app).get('/api/products/507f1f77bcf86cd799439011').expect(404);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('returns 200 and updated product', async () => {
      const create = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Original', price: 1, inventory: 5, category: 'c' })
        .expect(201);
      const res = await request(app)
        .put(`/api/products/${create.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(200);
      assert.strictEqual(res.body.name, 'Updated');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('returns 204', async () => {
      const create = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'ToDelete', price: 1, inventory: 0, category: 'c' })
        .expect(201);
      await request(app)
        .delete(`/api/products/${create.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
      await request(app).get(`/api/products/${create.body._id}`).expect(404);
    });
  });

  describe('GET /health', () => {
    it('returns 200', async () => {
      await request(app).get('/health').expect(200);
    });
  });
});
