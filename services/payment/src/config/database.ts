import { Pool } from 'pg';
import { createLogger } from 'common';

const logger = createLogger(process.env.SERVICE_NAME || 'payment-service');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'payment_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function connect(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();
    logger.info('PostgreSQL connected', { db: process.env.DB_NAME });
  } catch (err) {
    logger.error('PostgreSQL connection failed', { error: (err as Error).message });
    throw err;
  }
}

export async function initSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR(255) NOT NULL UNIQUE,
        amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'initiated',
        idempotency_key VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    `);
  } finally {
    client.release();
  }
}

export { pool };
