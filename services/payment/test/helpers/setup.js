const { pool } = require('../../dist/config/database');

function setupTestDb() {
  process.env.TEST = '1';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.DB_NAME = process.env.DB_NAME || 'postgres';
}

async function clearPayments() {
  await pool.query('DELETE FROM payments');
}

async function teardownTestDb() {
  await pool.end();
}

module.exports = { setupTestDb, clearPayments, teardownTestDb };
