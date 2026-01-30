const { ApplicationError } = require('common');
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Request error', { error: err.message, path: req.path, method: req.method });

  if (err instanceof ApplicationError) {
    return res.status(err.statusCode).json({ error: err.message, type: err.name });
  }
  res.status(500).json({ error: 'Internal server error', type: 'InternalError' });
}

module.exports = errorHandler;