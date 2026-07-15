/**
 * whatsapp.controller.ts
 *
 * REST handlers for WhatsApp integration:
 *   GET  /api/v1/whatsapp/qr     — returns the QR code for initial pairing
 *   GET  /api/v1/whatsapp/status  — returns current connection state
 *   POST /api/v1/whatsapp/send    — manually send a message to any number
 *
 * All endpoints are protected by Faculty-only authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getWhatsAppStatus, getQrCode, isReady, sendMessage, normalizePhone } from '../services/whatsapp.service';
import { logger } from '../utils/logger';
import QRCode from 'qrcode';

// ---------------------------------------------------------------------------
// GET /api/v1/whatsapp/qr
// ---------------------------------------------------------------------------

/**
 * Returns the WhatsApp pairing QR code as a base64 data URL.
 * If the client is already authenticated, returns a status message instead.
 */
export async function getQrHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const status = getWhatsAppStatus();

    if (status.state === 'READY' || status.state === 'AUTHENTICATED') {
      return res.json({
        success: true,
        code: 'ALREADY_AUTHENTICATED',
        message: 'WhatsApp is already connected.',
        data: { state: status.state, phone: status.phone },
      });
    }

    const qr = getQrCode();
    if (!qr) {
      return res.status(202).json({
        success: true,
        code: 'QR_NOT_READY',
        message: 'QR code is not yet available. The client may still be initializing. Try again in a few seconds.',
        data: { state: status.state },
      });
    }

    // Convert the QR string to a base64 PNG data URL for easy frontend rendering
    const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });

    return res.json({
      success: true,
      code: 'QR_READY',
      message: 'Scan this QR code with WhatsApp on your phone.',
      data: {
        state: status.state,
        qrDataUrl,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/whatsapp/status
// ---------------------------------------------------------------------------

/**
 * Returns the current WhatsApp connection status including uptime,
 * authenticated phone number, and reconnect attempt count.
 */
export async function getStatusHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const status = getWhatsAppStatus();

    return res.json({
      success: true,
      code: 'WHATSAPP_STATUS',
      data: {
        state: status.state,
        phone: status.phone,
        uptime: status.uptime,
        lastDisconnect: status.lastDisconnect,
        reconnectAttempts: status.reconnectAttempts,
      },
    });
  } catch (err) {
    return next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/whatsapp/send
// ---------------------------------------------------------------------------

const sendSchema = z.object({
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  message: z.string().min(1, 'Message body cannot be empty').max(4096, 'Message too long'),
});

/**
 * Manually sends a WhatsApp message to a given phone number.
 * Intended for faculty use — e.g. sending custom notifications.
 */
export async function sendMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = sendSchema.parse(req.body);

    if (!isReady()) {
      return res.status(503).json({
        success: false,
        code: 'WHATSAPP_NOT_READY',
        message: 'WhatsApp client is not connected. Please scan the QR code first.',
      });
    }

    const normalized = normalizePhone(body.phone);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PHONE',
        message: 'Invalid phone number format. Use 10-digit mobile or include country code.',
      });
    }

    const messageId = await sendMessage(normalized, body.message);
    logger.info('[whatsapp] Manual message sent', {
      phone: normalized,
      facultyId: req.auth?.sub,
      messageId,
    });

    return res.status(200).json({
      success: true,
      code: 'MESSAGE_SENT',
      message: 'WhatsApp message sent successfully.',
      data: { messageId, phone: normalized },
    });
  } catch (err: any) {
    if (err.message === 'WHATSAPP_NOT_READY') {
      return res.status(503).json({
        success: false,
        code: 'WHATSAPP_NOT_READY',
        message: 'WhatsApp client is not connected.',
      });
    }
    next(err);
    return;
  }
}
