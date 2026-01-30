import { createLogger } from 'common';
export default createLogger(process.env.SERVICE_NAME || 'payment-service');
