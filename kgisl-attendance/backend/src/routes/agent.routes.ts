import { Router } from 'express';
import { handleAgentChat } from '../controllers/agent.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Allow authenticated faculty and students to access agent chat
router.post('/chat', requireAuth(), handleAgentChat);

export default router;
