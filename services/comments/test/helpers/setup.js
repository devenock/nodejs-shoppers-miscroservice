const mongoose = require('mongoose');

function setupTestDb() {
  process.env.TEST = '1';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.DB_NAME = process.env.DB_NAME || 'comments_test';
}

async function clearCollections() {
  if (!mongoose.connection.db) return;
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    await mongoose.connection.db.collection(name).deleteMany({});
  }
}

async function teardownTestDb() {
  await mongoose.disconnect();
}

module.exports = { setupTestDb, clearCollections, teardownTestDb };
