import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from 'common';
import logger from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error('Request error', { error: err.message, path: req.path, method: req.method });

  if (err instanceof ApplicationError) {
    res.status((err as ApplicationError & { statusCode: number }).statusCode).json({ error: err.message, type: err.name });
    return;
  }
  res.status(500).json({ error: 'Internal server error', type: 'InternalError' });
}
