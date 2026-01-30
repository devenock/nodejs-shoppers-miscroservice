import { client } from '../config/redis';
import { parseEvent } from 'common';
import logger from '../utils/logger';
import { handleOrderCreated } from '../services/payment.service';

export async function startSubscribers(): Promise<void> {
  if (process.env.TEST === '1') return;

  const subscriber = (client as { duplicate: () => { connect: () => Promise<void>; subscribe: (ch: string, cb: (msg: string) => void) => Promise<void> } }).duplicate();
  await subscriber.connect();
  await subscriber.subscribe('order.created', (message: string) => {
    const event = parseEvent(message) as { data?: { orderId: string; userId: string; totalAmount: number } } | null;
    if (event?.data) {
      handleOrderCreated(event.data).catch((err: Error) =>
        logger.error('Subscriber error', { error: err.message })
      );
    }
  });
  logger.info('Subscribed to order.created');
}
