import { client } from '../config/redis';
import { parseEvent } from 'common';
import logger from '../utils/logger';
import { handlePaymentCompleted, handlePaymentFailed } from '../services/order.service';

export async function startSubscribers(): Promise<void> {
  if (process.env.TEST === '1') return;

  const subscriber = (client as { duplicate: () => { connect: () => Promise<void>; subscribe: (ch: string, cb: (msg: string) => void) => Promise<void> } }).duplicate();
  await subscriber.connect();

  await subscriber.subscribe('payment.completed', (message: string) => {
    const event = parseEvent(message) as { data?: { orderId: string; paymentId: string; amount: string } } | null;
    if (event?.data) handlePaymentCompleted(event.data).catch((err: Error) => logger.error('Subscriber error', { error: err.message }));
  });
  await subscriber.subscribe('payment.failed', (message: string) => {
    const event = parseEvent(message) as { data?: { orderId: string; paymentId: string } } | null;
    if (event?.data) handlePaymentFailed(event.data).catch((err: Error) => logger.error('Subscriber error', { error: err.message }));
  });
  logger.info('Subscribed to payment.completed, payment.failed');
}
