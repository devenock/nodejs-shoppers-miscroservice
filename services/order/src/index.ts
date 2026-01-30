import app from './app';
import { connect as connectDb, initSchema } from './config/database';
import { connect as connectRedis } from './config/redis';
import { startSubscribers } from './events/subscribers';
import logger from './utils/logger';

const PORT = Number(process.env.PORT) || 3005;

async function start(): Promise<void> {
  await connectDb();
  await initSchema();
  await connectRedis();
  await startSubscribers();
  app.listen(PORT, () => logger.info('Order service listening', { port: PORT }));
}

start().catch((err: Error) => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});
