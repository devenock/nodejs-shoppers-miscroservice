import { pool } from '../config/database';
import { ValidationError, NotFoundError } from 'common';
import { publish } from '../events/publishers';
import logger from '../utils/logger';
import type { Order, OrderStatus, OrderItem, OrderWithItems } from '../types';

function rowToOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    total_amount: row.total_amount as string,
    status: row.status as OrderStatus,
    created_at: row.created_at as Date,
    updated_at: row.updated_at as Date,
  };
}

export async function findById(id: string): Promise<OrderWithItems | null> {
  const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  if (orderResult.rows.length === 0) return null;
  const order = rowToOrder(orderResult.rows[0]);
  const itemsResult = await pool.query('SELECT product_id, quantity, price FROM order_items WHERE order_id = $1', [id]);
  return { ...order, items: itemsResult.rows };
}

export async function findByUserId(userId: string, limit = 50, skip = 0): Promise<{ orders: OrderWithItems[]; total: number }> {
  const countResult = await pool.query('SELECT COUNT(*) FROM orders WHERE user_id = $1', [userId]);
  const total = parseInt(String(countResult.rows[0].count), 10);
  const orderResult = await pool.query(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [userId, limit, skip]
  );
  const orders: OrderWithItems[] = [];
  for (const row of orderResult.rows) {
    const order = rowToOrder(row);
    const itemsResult = await pool.query('SELECT product_id, quantity, price FROM order_items WHERE order_id = $1', [order.id]);
    orders.push({ ...order, items: itemsResult.rows });
  }
  return { orders, total };
}

export async function create(userId: string, items: OrderItem[], totalAmount: number): Promise<OrderWithItems> {
  if (!items.length) throw new ValidationError('Order must have at least one item');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, totalAmount, 'pending']
    );
    const order = rowToOrder(orderResult.rows[0]);
    for (const item of items) {
      const price = item.price ?? 0;
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.productId, item.quantity, price]
      );
    }
    await client.query('COMMIT');
    const itemsPayload = items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price ?? 0 }));
    await publish('order.created', {
      orderId: order.id,
      userId,
      totalAmount,
      items: itemsPayload,
    });
    const itemsResult = await pool.query('SELECT product_id, quantity, price FROM order_items WHERE order_id = $1', [order.id]);
    return { ...order, items: itemsResult.rows };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateStatus(id: string, status: OrderStatus): Promise<Order> {
  const result = await pool.query(
    'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  if (result.rows.length === 0) throw new NotFoundError('Order');
  return rowToOrder(result.rows[0]);
}

export async function handlePaymentCompleted(data: { orderId: string; paymentId?: string; amount?: string }): Promise<void> {
  const { orderId } = data;
  const order = await findById(orderId);
  if (!order) {
    logger.warn('Order not found for payment.completed', { orderId });
    return;
  }
  if (order.status !== 'pending') {
    logger.info('Order already processed', { orderId, status: order.status });
    return;
  }
  await updateStatus(orderId, 'confirmed');
  const itemsPayload = order.items.map((i) => ({ productId: i.product_id, quantity: i.quantity }));
  await publish('order.confirmed', { orderId, userId: order.user_id, totalAmount: order.total_amount, items: itemsPayload });
}

export async function handlePaymentFailed(data: { orderId: string; paymentId?: string }): Promise<void> {
  const { orderId } = data;
  const order = await findById(orderId);
  if (!order) return;
  if (order.status !== 'pending') return;
  await updateStatus(orderId, 'cancelled');
  await publish('order.cancelled', { orderId, userId: order.user_id });
}

export async function cancel(orderId: string, userId: string): Promise<Order> {
  const order = await findById(orderId);
  if (!order) throw new NotFoundError('Order');
  if (order.user_id !== userId) throw new ValidationError('Not your order');
  if (order.status !== 'pending') throw new ValidationError('Only pending orders can be cancelled');
  const updated = await updateStatus(orderId, 'cancelled');
  await publish('order.cancelled', { orderId, userId });
  return updated;
}
