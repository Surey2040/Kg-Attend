import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { listSubjectsHandler, listRoomsHandler, listBatchesHandler } from '../controllers/catalog.controller';

const router = Router();

router.get('/subjects', requireAuth('FACULTY'), listSubjectsHandler);
router.get('/rooms', requireAuth('FACULTY'), listRoomsHandler);
router.get('/batches', requireAuth('FACULTY'), listBatchesHandler);

export default router;
