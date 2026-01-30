const { createLogger } = require('common');
module.exports = createLogger(process.env.SERVICE_NAME || 'auth-service');