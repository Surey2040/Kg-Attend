import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env, allowedOrigins } from '../config/env';
import { logger } from '../utils/logger';
import type { AuthPayload } from '../middleware/auth.middleware';

let io: SocketIOServer | null = null;

export function initWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }
        const isAllowed =
          allowedOrigins.includes(origin) ||
          /^http:\/\/localhost(:\d+)?$/.test(origin) ||
          origin.endsWith('.loca.lt') ||
          origin.endsWith('.localtunnel.me') ||
          origin.endsWith('.onrender.com');

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(null, false); // Reject gracefully
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth handshake — every socket connection must present a valid JWT.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('UNAUTHORIZED'));
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      (socket.data as any).auth = decoded;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  // Rate-limiting Map to prevent 'join_session' DDOS via tick spam
  const joinRateLimit = new Map<string, number>();

  io.on('connection', (socket: Socket) => {
    socket.on('join_session', (sessionId: string) => {
      // Room-per-session keeps broadcasts scoped — students/faculty only ever
      // receive updates for the exact session they're viewing.
      socket.join(sessionRoom(sessionId));
      logger.debug('[ws] socket joined session', { sessionId, socketId: socket.id });
      
      const auth = (socket.data as any).auth as AuthPayload;
      
      // Only Faculty need the initial QR tick to display on the projector.
      // Students only join to receive 'attendance_marked' events.
      if (auth.role === 'FACULTY') {
        const now = Date.now();
        const lastJoin = joinRateLimit.get(sessionId) || 0;
        
        // Prevent DDOS: Only allow one forced tick per session every 2 seconds.
        // This covers the page refresh case without allowing rapid-fire spam.
        if (now - lastJoin > 2000) {
          joinRateLimit.set(sessionId, now);
          
          // Force an immediate tick so the UI gets the QR code right away
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { tickAndBroadcast } = require('../services/session.service');
          tickAndBroadcast(sessionId).catch((err: any) => 
            logger.error('[ws] failed to trigger initial qr tick', { sessionId, error: err.message })
          );
        }
      }
    });

    socket.on('join_admin_live', () => {
      socket.join('admin_live');
      logger.debug('[ws] socket joined admin_live', { socketId: socket.id });
    });

    socket.on('leave_session', (sessionId: string) => {
      socket.leave(sessionRoom(sessionId));
    });

    socket.on('disconnect', () => {
      logger.debug('[ws] socket disconnected', { socketId: socket.id });
    });
  });

  return io;
}

function sessionRoom(sessionId: string) {
  return `session:${sessionId}`;
}

export interface QrUpdatePayload {
  qrImageDataUrl: string;
  issuedAt: number;
  expiresAt: number;
  refreshIntervalSeconds: number;
  stats: {
    totalStudents: number;
    present: number;
    absent: number;
    progressPercent: number;
  };
}

/** Pushed on every QR refresh — frontend swaps the image + resets countdown, NEVER reloads the page. */
export function broadcastQrUpdate(sessionId: string, payload: QrUpdatePayload) {
  io?.to(sessionRoom(sessionId)).emit('qr_updated', payload);
}

/** Pushed the moment a scan is accepted, so the "Recent Scans" / present-count UI updates live. */
export function broadcastAttendanceMarked(
  sessionId: string,
  data: { studentId: string; studentName: string; studentRoll: string; scanTime: string; isSuspicious?: boolean; flagReason?: string | null }
) {
  io?.to(sessionRoom(sessionId)).emit('attendance_marked', data);
  io?.to('admin_live').emit('attendance_marked', data);
}

export function broadcastSessionEnded(sessionId: string) {
  io?.to(sessionRoom(sessionId)).emit('session_ended', { sessionId });
}

export function broadcastGeofenceViolation(
  sessionId: string,
  data: { studentId: string; studentName: string; studentRoll: string; scanTime: string; distance: number }
) {
  io?.to(sessionRoom(sessionId)).emit('geofence_violation', data);
  io?.to('admin_live').emit('geofence_violation', data);
}
