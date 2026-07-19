import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
  }

  if (err instanceof ZodError) {
    const message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ success: false, code: 'VALIDATION_ERROR', message });
  }

  logger.error('[unhandled_error]', { path: req.path, error: (err as Error)?.message, stack: (err as Error)?.stack });
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: (err as Error)?.message || 'Something went wrong' });
}
