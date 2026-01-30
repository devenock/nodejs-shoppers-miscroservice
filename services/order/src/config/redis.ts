import { createClient } from 'redis';
import { createLogger } from 'common';

const logger = createLogger(process.env.SERVICE_NAME || 'order-service');
const isTest = process.env.TEST === '1';

const mockClient = {
  connect: async () => {},
  publish: async () => {},
  duplicate: () => ({ connect: async () => {}, subscribe: async () => {}, on: () => {} }),
};

export const client = isTest
  ? mockClient
  : createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });

if (!isTest) {
  (client as ReturnType<typeof createClient>).on('error', (err: Error) => logger.error('Redis error', { error: err.message }));
}

export async function connect(): Promise<void> {
  if (isTest) return;
  try {
    await (client as ReturnType<typeof createClient>).connect();
    logger.info('Redis connected');
  } catch (err) {
    logger.error('Redis connection failed', { error: (err as Error).message });
    throw err;
  }
}
