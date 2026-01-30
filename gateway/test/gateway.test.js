process.env.JWT_SECRET = 'test-secret';

const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const jwt = require('jsonwebtoken');

describe('Gateway', () => {
  let app;

  before(() => {
    app = require('../src/app');
  });

  describe('GET /health', () => {
    it('returns 200', async () => {
      const res = await request(app).get('/health').expect(200);
      assert.strictEqual(res.body.service, 'gateway');
    });
  });

  describe('Protected routes', () => {
    it('returns 401 for /api/orders without token', async () => {
      const res = await request(app).get('/api/orders').expect(401);
      assert.match(res.body.error, /token/i);
    });

    it('returns 401 for /api/products without token', async () => {
      await request(app).get('/api/products').expect(401);
    });
  });

  describe('Public auth routes', () => {
    it('does not return 401 for POST /api/auth/register (public path)', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com', password: 'pass123', name: 'X' });
      assert.notStrictEqual(res.status, 401);
    });
  });
});
