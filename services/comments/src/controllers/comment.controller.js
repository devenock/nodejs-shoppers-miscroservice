const commentService = require('../services/comment.service');

async function listByProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const { limit, skip } = req.query;
    const result = await commentService.listByProduct(productId, {
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const comment = await commentService.create(req.validated, req.user.id);
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const comment = await commentService.update(req.params.id, req.validated, req.user.id);
    res.json(comment);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await commentService.remove(req.params.id, req.user.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function flag(req, res, next) {
  try {
    const comment = await commentService.flag(req.params.id);
    res.json(comment);
  } catch (err) {
    next(err);
  }
}

module.exports = { listByProduct, create, update, remove, flag };
