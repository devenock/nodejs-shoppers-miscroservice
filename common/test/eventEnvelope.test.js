const { describe, it } = require('node:test');
const assert = require('node:assert');
const { buildEvent, parseEvent } = require('../events/eventEnvelope');

describe('eventEnvelope', () => {
  describe('buildEvent', () => {
    it('returns envelope with required fields', () => {
      const event = buildEvent('order.created', { orderId: '123' }, {}, 'order-service');
      assert.strictEqual(event.eventType, 'order.created');
      assert.strictEqual(event.source, 'order-service');
      assert.strictEqual(event.version, '1.0');
      assert.ok(event.eventId);
      assert.ok(event.timestamp);
      assert.ok(event.metadata.correlationId);
      assert.strictEqual(event.data.orderId, '123');
    });

    it('uses provided correlationId and causationId', () => {
      const event = buildEvent('test', {}, { correlationId: 'c1', causationId: 'c2' }, 'svc');
      assert.strictEqual(event.metadata.correlationId, 'c1');
      assert.strictEqual(event.metadata.causationId, 'c2');
    });
  });

  describe('parseEvent', () => {
    it('parses JSON string to object', () => {
      const obj = { eventType: 'test', data: {} };
      assert.deepStrictEqual(parseEvent(JSON.stringify(obj)), obj);
    });

    it('returns object as-is if already object', () => {
      const obj = { eventType: 'test' };
      assert.strictEqual(parseEvent(obj), obj);
    });

    it('returns null for invalid JSON', () => {
      assert.strictEqual(parseEvent('not json'), null);
    });
  });
});
