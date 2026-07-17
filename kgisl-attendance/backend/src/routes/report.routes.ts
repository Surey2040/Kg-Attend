import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getAggregatedReport, getStudentReport, getLowAttendanceReport, exportAttendanceCSV } from '../controllers/report.controller';

const router = Router();

router.get('/aggregated', requireAuth('FACULTY'), getAggregatedReport);
router.get('/student/:studentId', requireAuth('FACULTY'), getStudentReport);
router.get('/low-attendance', requireAuth('FACULTY', 'ADMIN'), getLowAttendanceReport);
router.get('/export-csv', requireAuth('FACULTY', 'ADMIN'), exportAttendanceCSV);

export default router;
