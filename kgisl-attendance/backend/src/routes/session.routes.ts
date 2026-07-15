import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  startSessionHandler,
  endSessionHandler,
  pauseSessionHandler,
  resumeSessionHandler,
  getSessionStatsHandler,
  getSessionPublicInfoHandler,
  manualAttendanceHandler,
  getActiveSessionHandler,
  refreshSessionHandler,
} from '../controllers/session.controller';

const router = Router();

router.post('/', requireAuth('FACULTY'), startSessionHandler);
router.get('/active', requireAuth('FACULTY'), getActiveSessionHandler);
router.post('/:sessionId/end', requireAuth('FACULTY'), endSessionHandler);
router.post('/:sessionId/pause', requireAuth('FACULTY'), pauseSessionHandler);
router.post('/:sessionId/resume', requireAuth('FACULTY'), resumeSessionHandler);
router.post('/:sessionId/refresh', requireAuth('FACULTY'), refreshSessionHandler);
router.post('/:sessionId/manual-attendance', requireAuth('FACULTY'), manualAttendanceHandler);
router.get('/:sessionId/stats', requireAuth('FACULTY', 'STUDENT'), getSessionStatsHandler);
router.get('/:sessionId/public', requireAuth('STUDENT'), getSessionPublicInfoHandler);

export default router;
