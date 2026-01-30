const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    inventory: { type: Number, required: true, default: 0, min: 0 },
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, price: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
