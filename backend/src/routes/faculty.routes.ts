import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listFacultyHandler, createFacultyHandler } from '../controllers/faculty.controller';

const router = Router();

router.get('/', requireAuth('FACULTY'), listFacultyHandler);
router.post('/', requireAuth('FACULTY'), createFacultyHandler);

export default router;
