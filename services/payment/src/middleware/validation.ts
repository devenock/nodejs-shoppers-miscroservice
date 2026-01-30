import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'common';

const initiateSchema = Joi.object({
  orderId: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  idempotencyKey: Joi.string(),
});

export function validateInitiate(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = initiateSchema.validate(req.body);
  if (error) return next(new ValidationError(error.details[0].message));
  req.validated = value;
  next();
}
