const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { setupTestDb, clearUsers, teardownTestDb } = require('../helpers/setup');

describe('Auth API', () => {
  let app;

  before(async () => {
    setupTestDb();
    const { connect } = require('../../src/config/database');
    await connect();
    const { connect: connectRedis } = require('../../src/config/redis');
    await connectRedis();
    await clearUsers();
    app = require('../../src/app');
  });

  after(async () => {
    await teardownTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 and user + token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'a@test.com', password: 'pass123', name: 'Alice' })
        .expect(201);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.email, 'a@test.com');
      assert.strictEqual(res.body.user.name, 'Alice');
      assert.ok(res.body.user.id);
    });

    it('returns 400 for duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@test.com', password: 'pass123', name: 'Dup' })
        .expect(201);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'dup@test.com', password: 'other12', name: 'Dup2' })
        .expect(400);
      assert.match(res.body.error, /already registered/i);
    });

    it('returns 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad', password: 'x', name: '' })
        .expect(400);
      assert.ok(res.body.error);
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and token for valid credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'login@test.com', password: 'pass123', name: 'Log' })
        .expect(201);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'pass123' })
        .expect(200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.email, 'login@test.com');
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'wrong' })
        .expect(401);
      assert.match(res.body.error, /invalid/i);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('returns valid: true with valid token', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ email: 'v@test.com', password: 'pass123', name: 'V' })
        .expect(201);
      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${reg.body.token}`)
        .expect(200);
      assert.strictEqual(res.body.valid, true);
      assert.ok(res.body.userId);
    });

    it('returns valid: false without token', async () => {
      const res = await request(app).get('/api/auth/verify').expect(200);
      assert.strictEqual(res.body.valid, false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('returns 200 and user with valid token', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({ email: 'p@test.com', password: 'pass123', name: 'Profile' })
        .expect(201);
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${reg.body.token}`)
        .expect(200);
      assert.strictEqual(res.body.email, 'p@test.com');
      assert.strictEqual(res.body.name, 'Profile');
    });

    it('returns 401 without token', async () => {
      await request(app).get('/api/auth/profile').expect(401);
    });
  });

  describe('GET /health', () => {
    it('returns 200', async () => {
      await request(app).get('/health').expect(200);
    });
  });
});