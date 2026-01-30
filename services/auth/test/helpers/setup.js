const mongoose = require('mongoose');

// Integration tests use real MongoDB (e.g. docker compose up). Use a test DB name.
function setupTestDb() {
  process.env.TEST = '1';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.DB_NAME = process.env.DB_NAME || 'auth_test';
}

async function clearUsers() {
  await mongoose.connection.db?.collection('users')?.deleteMany({});
}

async function teardownTestDb() {
  await mongoose.disconnect();
}

module.exports = { setupTestDb, clearUsers, teardownTestDb };