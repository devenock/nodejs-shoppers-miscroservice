const Comment = require('../models/Comment');
const { NotFoundError, ValidationError, ForbiddenError } = require('common');
const { publish } = require('../events/publishers');

async function listByProduct(productId, options = {}) {
  const { limit = 50, skip = 0 } = options;
  const comments = await Comment.find({ productId, parentId: null })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const withReplies = await Promise.all(
    comments.map(async (c) => {
      const replies = await Comment.find({ parentId: c._id }).sort({ createdAt: 1 }).lean();
      return { ...c, replies };
    })
  );
  const total = await Comment.countDocuments({ productId, parentId: null });
  return { comments: withReplies, total };
}

async function getById(id) {
  const comment = await Comment.findById(id);
  if (!comment) throw new NotFoundError('Comment');
  return comment;
}

async function create(data, userId) {
  const comment = await Comment.create({ ...data, userId });
  await publish('comment.created', {
    commentId: comment._id.toString(),
    productId: comment.productId,
    userId: comment.userId,
    parentId: comment.parentId?.toString(),
  });
  return comment;
}

async function update(id, data, userId) {
  const comment = await Comment.findById(id);
  if (!comment) throw new NotFoundError('Comment');
  if (comment.userId !== userId) throw new ForbiddenError('Not your comment');
  Object.assign(comment, data);
  await comment.save();
  await publish('comment.updated', {
    commentId: comment._id.toString(),
    productId: comment.productId,
  });
  return comment;
}

async function remove(id, userId) {
  const comment = await Comment.findById(id);
  if (!comment) throw new NotFoundError('Comment');
  if (comment.userId !== userId) throw new ForbiddenError('Not your comment');
  await Comment.deleteMany({ $or: [{ _id: id }, { parentId: id }] });
  await publish('comment.deleted', { commentId: id, productId: comment.productId });
  return comment;
}

async function flag(id) {
  const comment = await Comment.findByIdAndUpdate(id, { flagged: true }, { new: true });
  if (!comment) throw new NotFoundError('Comment');
  await publish('comment.flagged', { commentId: comment._id.toString(), productId: comment.productId });
  return comment;
}

module.exports = { listByProduct, getById, create, update, remove, flag };
