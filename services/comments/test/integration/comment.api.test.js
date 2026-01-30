const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { setupTestDb, clearCollections, teardownTestDb } = require('../helpers/setup');

describe('Comments API', () => {
  let app;
  let authToken;
  const productId = 'product-123';

  before(async () => {
    setupTestDb();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    authToken = jwt.sign({ userId: 'user-1', email: 'u@test.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

  describe('GET /api/comments/product/:productId', () => {
    it('returns 200 with empty list', async () => {
      const res = await request(app).get(`/api/comments/product/${productId}`).expect(200);
      assert.strictEqual(res.body.comments.length, 0);
      assert.strictEqual(res.body.total, 0);
    });
  });

  describe('POST /api/comments', () => {
    it('returns 201 and comment with auth', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, body: 'Great product!' })
        .expect(201);
      assert.strictEqual(res.body.body, 'Great product!');
      assert.strictEqual(res.body.userId, 'user-1');
      assert.ok(res.body._id);
    });

    it('returns 401 without token', async () => {
      await request(app).post('/api/comments').send({ productId, body: 'x' }).expect(401);
    });

    it('returns 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, body: '' })
        .expect(400);
      assert.ok(res.body.error);
    });
  });

  describe('PUT /api/comments/:id', () => {
    it('returns 200 and updated comment', async () => {
      const create = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, body: 'Original' })
        .expect(201);
      const res = await request(app)
        .put(`/api/comments/${create.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ body: 'Updated' })
        .expect(200);
      assert.strictEqual(res.body.body, 'Updated');
    });
  });

  describe('DELETE /api/comments/:id', () => {
    it('returns 204', async () => {
      const create = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId, body: 'To delete' })
        .expect(201);
      await request(app)
        .delete(`/api/comments/${create.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });

  describe('GET /health', () => {
    it('returns 200', async () => {
      await request(app).get('/health').expect(200);
    });
  });
});
