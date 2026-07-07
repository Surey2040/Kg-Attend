import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, code: err.code, message: err.message });
  }

  logger.error('[unhandled_error]', { path: req.path, error: (err as Error)?.message, stack: (err as Error)?.stack });
  return res.status(500).json({ success: false, code: 'INTERNAL_ERROR', message: 'Something went wrong' });
}
