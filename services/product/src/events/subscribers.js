const { client } = require('../config/redis');
const { parseEvent } = require('common');
const logger = require('../utils/logger');
const productService = require('../services/product.service');

const THRESHOLD = Number(process.env.INVENTORY_LOW_THRESHOLD) || 10;

async function handleOrderConfirmed(event) {
  const { orderId, items } = event.data || {};
  if (!orderId || !Array.isArray(items) || items.length === 0) {
    logger.warn('order.confirmed missing orderId or items', { eventId: event.eventId });
    return;
  }

  try {
    await productService.reduceInventoryForOrder(orderId, items, THRESHOLD);
  } catch (err) {
    logger.error('Failed to process order.confirmed', { orderId, error: err.message });
    throw err;
  }
}

async function startSubscribers() {
  if (process.env.TEST === '1') return;

  const subscriber = client.duplicate();
  await subscriber.connect();
  await subscriber.subscribe('order.confirmed', (message) => {
    const event = parseEvent(message);
    if (!event) return;
    handleOrderConfirmed(event).catch((err) => logger.error('Subscriber error', { error: err.message }));
  });
  logger.info('Subscribed to order.confirmed');
}

module.exports = { startSubscribers };
