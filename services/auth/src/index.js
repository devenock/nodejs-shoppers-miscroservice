const app = require('./app');
const { connect: connectDb } = require('./config/database');
const { connect: connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const PORT = Number(process.env.PORT) || 3001;

async function start() {
  await connectDb();
  await connectRedis();
  app.listen(PORT, () => logger.info('Auth service listening', { port: PORT }));
}

start().catch((err) => {
  logger.error('Startup failed', { error: err.message });
  process.exit(1);
});