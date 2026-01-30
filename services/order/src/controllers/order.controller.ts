import { Request, Response, NextFunction } from 'express';
import * as orderService from '../services/order.service';
import { NotFoundError } from 'common';

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { items, totalAmount } = req.validated as { items: Array<{ productId: string; quantity: number; price?: number }>; totalAmount: number };
    const order = await orderService.create(userId, items, totalAmount);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const result = await orderService.findByUserId(userId, limit, skip);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.findById(req.params.id);
    if (!order) throw new NotFoundError('Order');
    if (order.user_id !== req.user!.id) return next(new NotFoundError('Order'));
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await orderService.cancel(req.params.id, req.user!.id);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
