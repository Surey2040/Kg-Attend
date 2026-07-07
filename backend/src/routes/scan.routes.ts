import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { scanIpRateLimiter, scanStudentRateLimiter } from '../middleware/rateLimiter.middleware';
import { scanHandler } from '../controllers/scan.controller';

const router = Router();

router.post(
  '/',
  scanIpRateLimiter,
  requireAuth('STUDENT'),
  scanStudentRateLimiter,
  scanHandler
);

export default router;
