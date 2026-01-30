const { client } = require('../config/redis');
const { buildEvent } = require('common');
const logger = require('../utils/logger');

const source = process.env.SERVICE_NAME || 'product-service';

async function publish(eventType, data, metadata = {}) {
  const event = buildEvent(eventType, data, metadata, source);
  try {
    await client.publish(eventType, JSON.stringify(event));
    logger.info('Event published', { eventType, eventId: event.eventId });
    return event;
  } catch (err) {
    logger.error('Failed to publish event', { eventType, error: err.message });
    throw err;
  }
}

module.exports = { publish };
