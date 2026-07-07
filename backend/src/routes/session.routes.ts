import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  startSessionHandler,
  endSessionHandler,
  getSessionStatsHandler,
  getSessionPublicInfoHandler,
} from '../controllers/session.controller';

const router = Router();

router.post('/', requireAuth('FACULTY'), startSessionHandler);
router.post('/:sessionId/end', requireAuth('FACULTY'), endSessionHandler);
router.get('/:sessionId/stats', requireAuth('FACULTY', 'STUDENT'), getSessionStatsHandler);
router.get('/:sessionId/public', requireAuth('STUDENT'), getSessionPublicInfoHandler);

export default router;
