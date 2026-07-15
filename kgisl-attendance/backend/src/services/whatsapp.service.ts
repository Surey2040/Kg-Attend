/**
 * whatsapp.service.ts
 *
 * Singleton WhatsApp Web client powered by whatsapp-web.js with LocalAuth.
 * Handles: initialization, QR generation, auto-reconnect, message sending,
 * attendance notifications, duplicate prevention, and message logging.
 *
 * This module is entirely additive — it never touches existing attendance
 * logic. Notifications are fire-and-forget so a WhatsApp failure can never
 * block or break an attendance submission.
 */

import { Client, LocalAuth } from 'whatsapp-web.js';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { formatAttendanceMessage, formatParentNotification, AttendanceMessageData } from '../utils/messageFormatter';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WhatsAppConnectionState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_READY'
  | 'AUTHENTICATED'
  | 'READY';

interface WhatsAppStatus {
  state: WhatsAppConnectionState;
  qr: string | null;
  phone: string | null;
  uptime: number | null; // seconds since READY
  lastDisconnect: string | null;
  reconnectAttempts: number;
}

// ---------------------------------------------------------------------------
// Module-level state (singleton)
// ---------------------------------------------------------------------------

let client: Client | null = null;
let connectionState: WhatsAppConnectionState = 'DISCONNECTED';
let currentQr: string | null = null;
let authenticatedPhone: string | null = null;
let readySince: Date | null = null;
let lastDisconnect: Date | null = null;
let reconnectAttempts = 0;

// ---------------------------------------------------------------------------
// Phone number helpers
// ---------------------------------------------------------------------------

/**
 * Validates and normalizes a phone number into the whatsapp-web.js chat-id
 * format: "919876543210@c.us"
 *
 * Accepted inputs:
 *   - "919876543210"       → "919876543210@c.us"
 *   - "+919876543210"      → "919876543210@c.us"
 *   - "09876543210"        → "919876543210@c.us"  (leading 0 → India)
 *   - "9876543210"         → "919876543210@c.us"  (10-digit → India)
 */
export function normalizePhone(raw: string): string | null {
  // Strip everything except digits
  let digits = raw.replace(/\D/g, '');

  // 10-digit Indian mobile → prefix with 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    digits = '91' + digits;
  }

  // Leading 0 (trunk prefix) — replace with 91
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '91' + digits.slice(1);
  }

  // Final check: must be 12 digits for Indian numbers (91 + 10)
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Returns the whatsapp-web.js chat ID for a given phone number.
 */
function toChatId(phone: string): string {
  return `${phone}@c.us`;
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Creates and initializes the WhatsApp Web client.
 * Should be called once during server bootstrap.
 */
export async function initWhatsApp(): Promise<void> {
  if (!env.WHATSAPP_ENABLED) {
    logger.info('[whatsapp] WhatsApp integration is DISABLED via WHATSAPP_ENABLED=false');
    return;
  }

  if (client) {
    logger.warn('[whatsapp] Client already initialized — skipping duplicate init');
    return;
  }

  connectionState = 'CONNECTING';
  logger.info('[whatsapp] Initializing WhatsApp client...');

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.resolve(process.cwd(), env.WHATSAPP_SESSION_PATH),
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
      ],
    },
    // Use local webVersionCache to avoid remote fetch ENOTFOUND issues
    // @ts-ignore — webVersionCache is valid at runtime
    webVersionCache: {
      type: 'local',
    },
  });

  // ── QR Event ──
  client.on('qr', (qr: string) => {
    currentQr = qr;
    connectionState = 'QR_READY';
    logger.info('[whatsapp] QR code received — scan it via GET /api/v1/whatsapp/qr');

    // Also log a text-art QR to the console for quick local dev scanning
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const qrcodeTerminal = require('qrcode-terminal');
      qrcodeTerminal.generate(qr, { small: true });
    } catch {
      // qrcode-terminal is optional
    }
  });

  // ── Authenticated ──
  client.on('authenticated', () => {
    connectionState = 'AUTHENTICATED';
    currentQr = null; // QR no longer needed
    logger.info('[whatsapp] Authenticated successfully');
  });

  // ── Ready ──
  client.on('ready', async () => {
    connectionState = 'READY';
    currentQr = null;
    readySince = new Date();
    reconnectAttempts = 0;

    try {
      const info = client!.info;
      authenticatedPhone = info?.wid?.user ?? null;
      logger.info(`[whatsapp] Client is READY — connected as ${authenticatedPhone ?? 'unknown'}`);
    } catch {
      logger.info('[whatsapp] Client is READY');
    }
  });

  // ── Auth Failure ──
  client.on('auth_failure', (msg: string) => {
    connectionState = 'DISCONNECTED';
    currentQr = null;
    logger.error('[whatsapp] Authentication failure', { message: msg });
  });

  // ── Disconnected ──
  client.on('disconnected', (reason: string) => {
    connectionState = 'DISCONNECTED';
    lastDisconnect = new Date();
    authenticatedPhone = null;
    readySince = null;
    logger.warn('[whatsapp] Disconnected', { reason });

    // Auto-reconnect with exponential backoff
    if (reconnectAttempts < env.WHATSAPP_MAX_RECONNECT_RETRIES) {
      const delay = Math.min(10_000 * Math.pow(2, reconnectAttempts), 300_000); // max 5 min
      reconnectAttempts++;
      logger.info(`[whatsapp] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts}/${env.WHATSAPP_MAX_RECONNECT_RETRIES})`);
      setTimeout(() => {
        if (client) {
          connectionState = 'CONNECTING';
          client.initialize().catch((err: Error) => {
            logger.error('[whatsapp] Reconnect failed', { error: err.message });
          });
        }
      }, delay);
    } else {
      logger.error(`[whatsapp] Max reconnect retries (${env.WHATSAPP_MAX_RECONNECT_RETRIES}) exhausted — giving up`);
    }
  });

  // Start the client
  try {
    await client.initialize();
  } catch (err: any) {
    logger.error('[whatsapp] Failed to initialize client', { error: err.message });
    connectionState = 'DISCONNECTED';
  }
}

// ---------------------------------------------------------------------------
// Shutdown
// ---------------------------------------------------------------------------

/**
 * Gracefully destroys the WhatsApp client and Puppeteer browser.
 * Should be called during server shutdown.
 */
export async function destroyWhatsApp(): Promise<void> {
  if (!client) return;

  try {
    await client.destroy();
    logger.info('[whatsapp] Client destroyed');
  } catch (err: any) {
    logger.error('[whatsapp] Error destroying client', { error: err.message });
  } finally {
    client = null;
    connectionState = 'DISCONNECTED';
    currentQr = null;
    authenticatedPhone = null;
    readySince = null;
  }
}

// ---------------------------------------------------------------------------
// Status / QR getters
// ---------------------------------------------------------------------------

export function getWhatsAppStatus(): WhatsAppStatus {
  return {
    state: connectionState,
    qr: currentQr,
    phone: authenticatedPhone,
    uptime: readySince ? Math.floor((Date.now() - readySince.getTime()) / 1000) : null,
    lastDisconnect: lastDisconnect?.toISOString() ?? null,
    reconnectAttempts,
  };
}

export function getQrCode(): string | null {
  return currentQr;
}

export function isReady(): boolean {
  return connectionState === 'READY' && client !== null;
}

// ---------------------------------------------------------------------------
// Send message
// ---------------------------------------------------------------------------

/**
 * Sends a WhatsApp text message to the given phone number.
 * Validates the number and ensures the client is connected.
 *
 * @returns The whatsapp-web.js message ID on success.
 * @throws Error if client is not ready or phone is invalid.
 */
export async function sendMessage(phone: string, text: string): Promise<string> {
  if (!isReady() || !client) {
    throw new Error('WHATSAPP_NOT_READY');
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error('INVALID_PHONE_NUMBER');
  }

  const chatId = toChatId(normalized);
  
  // Log before checking
  logger.info(`[whatsapp] Checking if ${chatId} is registered on WhatsApp...`);
  
  try {
    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      logger.warn(`[whatsapp] Number ${chatId} is NOT registered on WhatsApp.`);
      throw new Error('NUMBER_NOT_ON_WHATSAPP');
    }

    logger.info(`[whatsapp] Number is registered. Sending message to ${chatId}...`);
    const msg = await client.sendMessage(chatId, text);
    const msgId = msg?.id?._serialized || 'unknown_id';
    logger.info(`[whatsapp] Message successfully sent with ID: ${msgId}`);
    return msgId;
  } catch (error: any) {
    logger.error(`[whatsapp] Error in sendMessage for ${chatId}:`, { error: error.message || error });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Attendance notification
// ---------------------------------------------------------------------------

/**
 * Sends an attendance WhatsApp notification to the student (and optionally
 * parent). Handles duplicate prevention, retry, and logging.
 *
 * This function is designed to be called fire-and-forget —
 * it catches all errors internally and logs them.
 *
 * @param record - The Prisma AttendanceRecord with included student, session,
 *                 session.subject, and session.room relations.
 */
export async function sendAttendanceNotification(record: any): Promise<void> {
  if (!env.WHATSAPP_ENABLED || !isReady()) {
    return; // Silently skip — WhatsApp is off or not connected
  }

  const student = record.student;
  if (!student) {
    logger.warn('[whatsapp] No student relation on attendance record — skipping notification');
    return;
  }

  // ── Duplicate prevention ──
  const existingLog = await prisma.whatsAppMessageLog.findFirst({
    where: {
      attendanceId: record.id,
      studentId: student.id,
      status: 'SENT',
      messageType: 'ATTENDANCE',
    },
  });

  if (existingLog) {
    logger.debug('[whatsapp] Duplicate notification skipped', { attendanceId: record.id });
    return;
  }

  // ── Build message data ──
  const scanTime = new Date(record.scanTime);
  const messageData: AttendanceMessageData = {
    studentName: student.name,
    registerNo: student.rollNo,
    status: record.status,
    date: scanTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: scanTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    location: record.session?.room?.name ?? 'KGiSL Campus',
    subjectName: record.session?.subject?.name,
    batchName: record.session?.batch?.name,
  };

  // ── Send to student ──
  if (student.phone) {
    const message = formatAttendanceMessage(messageData);
    await sendWithRetryAndLog({
      studentId: student.id,
      phone: student.phone,
      messageBody: message,
      attendanceId: record.id,
      messageType: 'ATTENDANCE',
    });
  }

  // ── Send to parent (optional) ──
  if (student.parentPhone) {
    const parentMessage = formatParentNotification(messageData);
    await sendWithRetryAndLog({
      studentId: student.id,
      phone: student.parentPhone,
      messageBody: parentMessage,
      attendanceId: record.id,
      messageType: 'PARENT',
    });
  }
}

// ---------------------------------------------------------------------------
// Internal: send with retry + DB logging
// ---------------------------------------------------------------------------

interface SendAndLogInput {
  studentId: string;
  phone: string;
  messageBody: string;
  attendanceId?: string;
  messageType: string;
}

async function sendWithRetryAndLog(input: SendAndLogInput): Promise<void> {
  const { studentId, phone, messageBody, attendanceId, messageType } = input;

  const normalized = normalizePhone(phone);
  if (!normalized) {
    await logMessage(studentId, phone, messageBody, 'FAILED', 'Invalid phone number', attendanceId, messageType);
    return;
  }

  // First attempt
  try {
    await sendMessage(normalized, messageBody);
    await logMessage(studentId, normalized, messageBody, 'SENT', null, attendanceId, messageType);
    logger.info('[whatsapp] Message sent', { studentId, phone: normalized, messageType });
    return;
  } catch (firstErr: any) {
    logger.warn('[whatsapp] First send attempt failed — retrying', {
      studentId,
      phone: normalized,
      error: firstErr.message,
    });
  }

  // Retry once after delay
  await sleep(env.WHATSAPP_RETRY_DELAY_MS);

  try {
    await sendMessage(normalized, messageBody);
    await logMessage(studentId, normalized, messageBody, 'SENT', null, attendanceId, messageType);
    logger.info('[whatsapp] Message sent on retry', { studentId, phone: normalized, messageType });
  } catch (retryErr: any) {
    await logMessage(studentId, normalized, messageBody, 'RETRY_FAILED', retryErr.message, attendanceId, messageType);
    logger.error('[whatsapp] Retry also failed', { studentId, phone: normalized, error: retryErr.message });
  }
}

// ---------------------------------------------------------------------------
// Internal: DB log
// ---------------------------------------------------------------------------

async function logMessage(
  studentId: string,
  phone: string,
  messageBody: string,
  status: string,
  errorMessage: string | null,
  attendanceId: string | undefined,
  messageType: string,
): Promise<void> {
  try {
    await prisma.whatsAppMessageLog.create({
      data: {
        studentId,
        phone,
        messageBody,
        status,
        errorMessage,
        attendanceId: attendanceId ?? null,
        messageType,
      },
    });
  } catch (dbErr: any) {
    // Never let a logging failure propagate — the notification itself is best-effort.
    logger.error('[whatsapp] Failed to write message log', { error: dbErr.message });
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
