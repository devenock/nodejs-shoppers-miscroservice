const express = require('express');
const commentController = require('../controllers/comment.controller');
const { validateCreate, validateUpdate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/product/:productId', commentController.listByProduct);
router.post('/', authenticate, validateCreate, commentController.create);
router.put('/:id', authenticate, validateUpdate, commentController.update);
router.delete('/:id', authenticate, commentController.remove);
router.post('/:id/flag', authenticate, commentController.flag);

module.exports = router;
