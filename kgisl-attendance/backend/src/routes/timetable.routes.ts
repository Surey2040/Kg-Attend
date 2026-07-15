import { Router } from 'express';
import { importTimetable, listTimetableAllocations } from '../controllers/timetable.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Admin only can import
router.post('/import', requireAuth('FACULTY'), importTimetable); // Ideally 'ADMIN'

// Both faculty and admin can view
router.get('/', listTimetableAllocations);

export default router;
