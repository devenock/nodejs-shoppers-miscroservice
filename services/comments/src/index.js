const app = require('./app');
const { connect: connectDb } = require('./config/database');
const { connect: connectRedis } = require('./config/redis');
const { startSubscribers } = require('./events/subscribers');
const logger = require('./utils/logger');

const PORT = Number(process.env.PORT) || 3003;

async function start() {
  await connectDb();
  await connectRedis();
  await startSubscribers();
  app.listen(PORT, () => logger.info('Comments service listening', { port: PORT }));
}

start().catch((err) => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});
