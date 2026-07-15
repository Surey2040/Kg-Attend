import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getAggregatedReport, getStudentReport } from '../controllers/report.controller';

const router = Router();

router.get('/aggregated', requireAuth('FACULTY'), getAggregatedReport);
router.get('/student/:studentId', requireAuth('FACULTY'), getStudentReport);

export default router;
