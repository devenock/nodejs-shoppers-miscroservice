import express from 'express';
import * as paymentController from '../controllers/payment.controller';
import { validateInitiate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/initiate', authenticate, validateInitiate, paymentController.initiate);
router.get('/order/:orderId', authenticate, paymentController.getByOrderId);
router.get('/:id', authenticate, paymentController.getById);
router.post('/:id/refund', authenticate, paymentController.refund);

export default router;
