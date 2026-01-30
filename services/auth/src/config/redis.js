const { createClient } = require('redis');
const logger = require('../utils/logger');

const isTest = process.env.TEST === '1';

const client = isTest
  ? { connect: async () => {}, publish: async () => {}, on: () => {} }
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });

if (!isTest) client.on('error', (err) => logger.error('Redis error', { error: err.message }));

async function connect() {
  if (isTest) return;
  try {
    await client.connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Redis connection failed', { error: err.message });
    throw err;
  }
}

module.exports = { client, connect };