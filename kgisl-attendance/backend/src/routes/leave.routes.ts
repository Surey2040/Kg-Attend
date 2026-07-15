import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { submitLeaveRequest, getMyLeaveRequests, getPendingLeaveRequests, reviewLeaveRequest } from '../controllers/leave.controller';

const router = Router();

// Student routes
router.post('/my-requests', requireAuth('STUDENT'), submitLeaveRequest);
router.get('/my-requests', requireAuth('STUDENT'), getMyLeaveRequests);

// Faculty routes
router.get('/pending', requireAuth('FACULTY'), getPendingLeaveRequests);
router.post('/:id/review', requireAuth('FACULTY'), reviewLeaveRequest);

export default router;
