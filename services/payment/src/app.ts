import express from 'express';
import { pool } from './config/database';
import paymentRoutes from './routes/payment.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'payment' }));
app.get('/health/ready', async (_req, res) => {
  try {
    const client = await pool.connect();
    client.release();
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});
app.get('/health/live', (_req, res) => res.status(200).json({ live: true }));

app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

export default app;
