import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  submitMonthlySignatureHandler,
  getStudentMonthlySignatureHandler,
  getFacultyMonthlySignaturesHandler,
  sendFacultyMonthlySignatureEmailHandler,
} from '../controllers/monthlySignature.controller';

const router = Router();

// Student routes
router.post('/submit', requireAuth('STUDENT', 'ADMIN', 'FACULTY'), submitMonthlySignatureHandler);
router.get('/student', requireAuth('STUDENT', 'ADMIN', 'FACULTY'), getStudentMonthlySignatureHandler);

// Faculty routes
router.get('/faculty', requireAuth('FACULTY', 'ADMIN'), getFacultyMonthlySignaturesHandler);
router.post('/send-email', requireAuth('FACULTY', 'ADMIN'), sendFacultyMonthlySignatureEmailHandler);

export default router;
