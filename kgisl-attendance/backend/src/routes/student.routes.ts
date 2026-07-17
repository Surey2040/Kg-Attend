import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listStudentsHandler, resetStudentDeviceHandler } from '../controllers/student.controller';

const router = Router();

router.get('/', requireAuth('FACULTY'), listStudentsHandler);
router.post('/:id/reset-device', requireAuth('ADMIN', 'FACULTY'), resetStudentDeviceHandler);

export default router;
