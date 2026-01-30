import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'common';

const createSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0),
      })
    )
    .min(1)
    .required(),
  totalAmount: Joi.number().min(0).required(),
});

export function validateCreate(req: Request, res: Response, next: NextFunction): void {
  const { error, value } = createSchema.validate(req.body);
  if (error) return next(new ValidationError(error.details[0].message));
  req.validated = value;
  next();
}
