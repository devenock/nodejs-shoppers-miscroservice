const Product = require('../models/Product');
const ProcessedOrder = require('../models/ProcessedOrder');
const { ValidationError, NotFoundError } = require('common');
const { publish } = require('../events/publishers');
const logger = require('../utils/logger');

async function list(filters = {}) {
  const { category, search, limit = 50, skip = 0 } = filters;
  const query = {};
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(query).skip(skip).limit(limit).lean(),
    Product.countDocuments(query),
  ]);
  return { products, total };
}

async function getById(id) {
  const product = await Product.findById(id);
  if (!product) throw new NotFoundError('Product');
  return product;
}

async function create(data) {
  const product = await Product.create(data);
  await publish('product.created', {
    productId: product._id.toString(),
    name: product.name,
    category: product.category,
  });
  return product;
}

async function update(id, data) {
  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw new NotFoundError('Product');
  await publish('product.updated', {
    productId: product._id.toString(),
    name: product.name,
    category: product.category,
  });
  return product;
}

async function remove(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new NotFoundError('Product');
  await publish('product.deleted', { productId: product._id.toString() });
  return product;
}

async function reduceInventoryForOrder(orderId, items, lowThreshold) {
  const existing = await ProcessedOrder.findOne({ orderId });
  if (existing) {
    logger.info('Order already processed', { orderId });
    return;
  }

  const session = await Product.startSession();
  session.startTransaction();
  try {
    for (const item of items) {
      const { productId, quantity } = item;
      if (!productId || quantity == null || quantity < 1) continue;

      const product = await Product.findById(productId).session(session);
      if (!product) throw new ValidationError(`Product ${productId} not found`);
      if (product.inventory < quantity) throw new ValidationError(`Insufficient inventory for ${productId}`);

      product.inventory -= quantity;
      await product.save({ session });

      if (product.inventory < lowThreshold) {
        await publish('product.inventory.low', {
          productId: product._id.toString(),
          remainingInventory: product.inventory,
        });
      }
    }
    await ProcessedOrder.create([{ orderId }], { session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  reduceInventoryForOrder,
};
