const { client } = require('../config/redis');
const { parseEvent } = require('common');
const logger = require('../utils/logger');
const Comment = require('../models/Comment');

async function handleProductDeleted(event) {
  const { productId } = event.data || {};
  if (!productId) return;
  const result = await Comment.deleteMany({ productId });
  logger.info('Deleted comments for product', { productId, count: result.deletedCount });
}

async function handleUserDeleted(event) {
  const { userId } = event.data || {};
  if (!userId) return;
  await Comment.updateMany({ userId }, { $set: { body: '[deleted]', userId: 'deleted' } });
  logger.info('Anonymized comments for user', { userId });
}

async function startSubscribers() {
  if (process.env.TEST === '1') return;

  const subscriber = client.duplicate();
  await subscriber.connect();

  const handleMessage = (message, channel) => {
    const event = parseEvent(message);
    if (!event) return;
    const handler = channel === 'product.deleted' ? handleProductDeleted : channel === 'user.deleted' ? handleUserDeleted : null;
    if (handler) handler(event).catch((err) => logger.error('Subscriber error', { error: err.message }));
  };

  await subscriber.subscribe('product.deleted', handleMessage);
  await subscriber.subscribe('user.deleted', handleMessage);
  logger.info('Subscribed to product.deleted, user.deleted');
}

module.exports = { startSubscribers };
