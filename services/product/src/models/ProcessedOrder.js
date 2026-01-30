const mongoose = require('mongoose');

const processedOrderSchema = new mongoose.Schema(
  { orderId: { type: String, required: true, unique: true } },
  { timestamps: true }
);

module.exports = mongoose.model('ProcessedOrder', processedOrderSchema);
