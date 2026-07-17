import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { scanAttendanceHandler, getTodayAttendanceHandler } from '../controllers/attendance.controller';

const router = Router();

router.post('/scan', requireAuth('STUDENT'), scanAttendanceHandler);
router.get('/today', requireAuth('FACULTY', 'ADMIN'), getTodayAttendanceHandler);

export default router;
