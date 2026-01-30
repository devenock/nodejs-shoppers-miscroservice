const mongoose = require('mongoose');
const logger = require('../utils/logger');

const uri =
  process.env.MONGODB_URI ||
  `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'auth_db'}`;

async function connect() {
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected', { db: process.env.DB_NAME });
  } catch (err) {
    logger.error('MongoDB connection failed', { error: err.message });
    throw err;
  }
}

module.exports = { connect };