import { client } from '../config/redis';
import { buildEvent } from 'common';
import logger from '../utils/logger';

const source = process.env.SERVICE_NAME || 'payment-service';

export async function publish(eventType: string, data: Record<string, unknown>, metadata: Record<string, string> = {}): Promise<void> {
  const event = buildEvent(eventType, data, metadata, source);
  try {
    await (client as { publish: (ch: string, msg: string) => Promise<unknown> }).publish(eventType, JSON.stringify(event));
    logger.info('Event published', { eventType, eventId: event.eventId });
  } catch (err) {
    logger.error('Failed to publish event', { eventType, error: (err as Error).message });
    throw err;
  }
}
