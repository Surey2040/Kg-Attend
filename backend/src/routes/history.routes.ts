import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listSessionHistoryHandler } from '../controllers/history.controller';

const router = Router();

router.get('/', requireAuth('FACULTY'), listSessionHistoryHandler);

export default router;
