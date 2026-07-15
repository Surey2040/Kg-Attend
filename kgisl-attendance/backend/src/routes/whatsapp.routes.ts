/**
 * whatsapp.routes.ts
 *
 * Express router for WhatsApp integration endpoints.
 * All routes are protected by Faculty-only authentication.
 *
 * Routes:
 *   GET  /api/v1/whatsapp/qr      — Get the pairing QR code
 *   GET  /api/v1/whatsapp/status   — Get connection status
 *   POST /api/v1/whatsapp/send     — Send a manual message
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { getQrHandler, getStatusHandler, sendMessageHandler } from '../controllers/whatsapp.controller';

const router = Router();

// All WhatsApp management endpoints require faculty authentication
router.get('/qr', requireAuth('FACULTY'), getQrHandler);
router.get('/status', requireAuth('FACULTY'), getStatusHandler);
router.post('/send', requireAuth('FACULTY'), sendMessageHandler);

export default router;
