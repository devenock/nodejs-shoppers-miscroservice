const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    body: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    rating: { type: Number, min: 1, max: 5 },
    flagged: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ productId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
