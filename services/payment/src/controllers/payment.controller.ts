import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';
import { NotFoundError } from 'common';

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await paymentService.findById(req.params.id);
    if (!payment) throw new NotFoundError('Payment');
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

export async function getByOrderId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payments = await paymentService.findByOrder(req.params.orderId);
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

export async function initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { orderId, amount, idempotencyKey } = req.validated as { orderId: string; amount: number; idempotencyKey?: string };
    const payment = await paymentService.createPayment(orderId, amount, idempotencyKey);
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
}

export async function refund(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const payment = await paymentService.refund(req.params.id);
    res.json(payment);
  } catch (err) {
    next(err);
  }
}
