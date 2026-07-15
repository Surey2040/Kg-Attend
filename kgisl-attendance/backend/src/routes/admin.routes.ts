import { Router } from 'express';
import {
  getStats,
  listFaculty,
  createFaculty,
  listStudents,
  createStudent,
  createBatch,
  createSubject,
  createRoom,
  getAuditLogs
} from '../controllers/admin.controller';

const router = Router();

// Stats
router.get('/stats', getStats);

// Faculty
router.get('/faculty', listFaculty);
router.post('/faculty', createFaculty);

// Students
router.get('/students', listStudents);
router.post('/students', createStudent);

// Academic Master Data
router.post('/batches', createBatch);
router.post('/subjects', createSubject);
router.post('/rooms', createRoom);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
