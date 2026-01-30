import { pool } from '../config/database';
import { ValidationError, NotFoundError } from 'common';
import { publish } from '../events/publishers';
import logger from '../utils/logger';
import type { Payment, PaymentStatus, OrderCreatedEventData } from '../types';

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    order_id: row.order_id as string,
    amount: row.amount as string,
    status: row.status as PaymentStatus,
    idempotency_key: (row.idempotency_key as string) || null,
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
  };
}

export async function findByOrderId(orderId: string): Promise<Payment | null> {
  const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
  if (result.rows.length === 0) return null;
  return rowToPayment(result.rows[0]);
}

export async function findById(id: string): Promise<Payment | null> {
  const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  if (result.rows.length === 0) return null;
  return rowToPayment(result.rows[0]);
}

export async function findByOrder(orderId: string): Promise<Payment[]> {
  const result = await pool.query('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC', [orderId]);
  return result.rows.map(rowToPayment);
}

export async function createPayment(orderId: string, amount: number, idempotencyKey?: string): Promise<Payment> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id FROM payments WHERE order_id = $1', [orderId]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return rowToPayment(existing.rows[0]);
    }
    const result = await client.query(
      `INSERT INTO payments (order_id, amount, status, idempotency_key) VALUES ($1, $2, 'processing', $3) RETURNING *`,
      [orderId, amount, idempotencyKey || null]
    );
    await client.query('COMMIT');
    return rowToPayment(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateStatus(id: string, status: PaymentStatus): Promise<Payment> {
  const result = await pool.query(
    `UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Payment');
  return rowToPayment(result.rows[0]);
}

export async function handleOrderCreated(data: OrderCreatedEventData): Promise<void> {
  const { orderId, totalAmount } = data;
  if (!orderId || totalAmount == null) {
    logger.warn('order.created missing orderId or totalAmount', data);
    return;
  }

  const existing = await findByOrderId(orderId);
  if (existing) {
    logger.info('Payment already exists for order', { orderId });
    return;
  }

  const payment = await createPayment(orderId, Number(totalAmount));
  await publish('payment.initiated', { paymentId: payment.id, orderId, amount: payment.amount });

  try {
    await recordBlockchain(payment.id, orderId, payment.amount);
    await updateStatus(payment.id, 'completed');
    await publish('payment.completed', { paymentId: payment.id, orderId, amount: payment.amount });
  } catch (err) {
    logger.error('Payment processing failed', { orderId, error: (err as Error).message });
    await updateStatus(payment.id, 'failed');
    await publish('payment.failed', { paymentId: payment.id, orderId, reason: (err as Error).message });
  }
}

async function recordBlockchain(_paymentId: string, _orderId: string, _amount: string): Promise<void> {
  if (process.env.BLOCKCHAIN_RPC_URL) {
    logger.info('Blockchain record (stub)', { orderId: _orderId, amount: _amount });
  }
}

export async function refund(paymentId: string): Promise<Payment> {
  const payment = await findById(paymentId);
  if (!payment) throw new NotFoundError('Payment');
  if (payment.status !== 'completed') throw new ValidationError('Only completed payments can be refunded');
  const updated = await updateStatus(paymentId, 'refunded');
  await publish('payment.refunded', { paymentId, orderId: payment.order_id, amount: payment.amount });
  return updated;
}
