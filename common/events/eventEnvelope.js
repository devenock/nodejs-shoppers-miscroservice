const { randomUUID } = require('crypto');

/**
 * Build standard event envelope for pub/sub.
 * @param {string} eventType - e.g. 'order.created'
 * @param {object} data - Event payload
 * @param {object} [metadata] - Optional correlationId, causationId
 * @param {string} source - Service name (e.g. process.env.SERVICE_NAME)
 * @returns {object} Event envelope
 */
function buildEvent(eventType, data, metadata = {}, source = 'unknown') {
  const correlationId = metadata.correlationId || randomUUID();
  return {
    eventId: randomUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    version: '1.0',
    source,
    data,
    metadata: {
      correlationId,
      causationId: metadata.causationId || null,
    },
  };
}

/**
 * Parse message from event bus (e.g. Redis) into event object.
 * @param {string} message - JSON string
 * @returns {object} Parsed event or null if invalid
 */
function parseEvent(message) {
  try {
    return typeof message === 'string' ? JSON.parse(message) : message;
  } catch {
    return null;
  }
}

module.exports = { buildEvent, parseEvent };
