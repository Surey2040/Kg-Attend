import { Router } from 'express';
import {
  facultyLoginHandler,
  studentLoginHandler,
  refreshHandler,
  logoutHandler,
} from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/faculty/login', authRateLimiter, facultyLoginHandler);
router.post('/student/login', authRateLimiter, studentLoginHandler);
router.post('/refresh', authRateLimiter, refreshHandler);
router.post('/logout', logoutHandler);

export default router;
