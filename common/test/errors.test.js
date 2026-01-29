const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  ApplicationError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} = require('../errors');

describe('errors', () => {
  it('ApplicationError has statusCode and name', () => {
    const err = new ApplicationError('msg', 500);
    assert.strictEqual(err.message, 'msg');
    assert.strictEqual(err.statusCode, 500);
    assert.strictEqual(err.name, 'ApplicationError');
  });

  it('ValidationError has status 400', () => {
    const err = new ValidationError('invalid');
    assert.strictEqual(err.statusCode, 400);
  });

  it('NotFoundError message includes resource', () => {
    const err = new NotFoundError('Product');
    assert.strictEqual(err.message, 'Product not found');
    assert.strictEqual(err.statusCode, 404);
  });

  it('UnauthorizedError has status 401', () => {
    const err = new UnauthorizedError();
    assert.strictEqual(err.statusCode, 401);
  });

  it('ForbiddenError has status 403', () => {
    const err = new ForbiddenError();
    assert.strictEqual(err.statusCode, 403);
  });
});
