import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getLiveCampusData } from '../controllers/live.controller';

const router = Router();

// Only admin can view the live campus heatmap
router.get('/', requireAuth('ADMIN'), getLiveCampusData);

export default router;
