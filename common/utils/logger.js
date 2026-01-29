const winston = require('winston');

/**
 * Create a logger for a service.
 * @param {string} serviceName - e.g. process.env.SERVICE_NAME
 * @returns {winston.Logger}
 */
function createLogger(serviceName = 'service') {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });
}

module.exports = { createLogger };
