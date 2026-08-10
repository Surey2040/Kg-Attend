import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { scanAttendanceHandler, getTodayAttendanceHandler, getStudentHistoryHandler } from '../controllers/attendance.controller';

import multer from 'multer';
import { verifyHeadcount } from '../controllers/ai.controller';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/scan', requireAuth('STUDENT'), scanAttendanceHandler);
router.get('/today', requireAuth('FACULTY', 'ADMIN'), getTodayAttendanceHandler);
router.get('/student/history', requireAuth('STUDENT'), getStudentHistoryHandler);
router.post('/verify-headcount/:sessionId', requireAuth('FACULTY', 'ADMIN'), upload.single('image'), verifyHeadcount);

export default router;
