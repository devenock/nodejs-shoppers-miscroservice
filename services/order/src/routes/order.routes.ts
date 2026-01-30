import express from 'express';
import * as orderController from '../controllers/order.controller';
import { validateCreate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, validateCreate, orderController.create);
router.get('/', authenticate, orderController.list);
router.get('/:id', authenticate, orderController.getById);
router.put('/:id/cancel', authenticate, orderController.cancel);

export default router;
