import { Router } from 'express';
import {
  facultyLoginHandler,
  studentLoginHandler,
  adminLoginHandler,
  refreshHandler,
  logoutHandler,
  registerFacultyHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  resetDevicesHandler
} from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/faculty/register', authRateLimiter, registerFacultyHandler);
router.post('/faculty/login', authRateLimiter, facultyLoginHandler);
router.post('/student/login', authRateLimiter, studentLoginHandler);
router.post('/admin/login', authRateLimiter, adminLoginHandler);

router.post('/forgot-password', authRateLimiter, forgotPasswordHandler);
router.post('/reset-password', authRateLimiter, resetPasswordHandler);

router.post('/refresh', authRateLimiter, refreshHandler);
router.post('/logout', logoutHandler);

router.get('/reset-devices', requireAuth('ADMIN'), resetDevicesHandler);

export default router;
