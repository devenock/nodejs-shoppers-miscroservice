const productService = require('../services/product.service');

async function list(req, res, next) {
  try {
    const { category, search, limit, skip } = req.query;
    const result = await productService.list({
      category,
      search,
      limit: limit ? Number(limit) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await productService.getById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.create(req.validated);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await productService.update(req.params.id, req.validated);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.remove(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
