const { createLogger } = require('common');
module.exports = createLogger(process.env.SERVICE_NAME || 'product-service');
