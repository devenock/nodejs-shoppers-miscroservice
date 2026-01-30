const express = require('express');
const productController = require('../controllers/product.controller');
const { validateCreate, validateUpdate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', productController.list);
router.get('/:id', productController.getById);
router.post('/', authenticate, validateCreate, productController.create);
router.put('/:id', authenticate, validateUpdate, productController.update);
router.delete('/:id', authenticate, productController.remove);

module.exports = router;
