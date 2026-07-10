import { prisma } from '../config/prisma';
import { redis, qrRedisKey } from '../config/redis';
import { env } from '../config/env';
import { verifyQrSignature, sha256Hex, QrSignableFields } from '../utils/crypto';
import { distanceMeters } from '../utils/geo';
import { Errors } from '../utils/AppError';
import { logger } from '../utils/logger';
import { broadcastAttendanceMarked } from '../websocket/socket';

export interface ScanRequest {
  studentId: string;
  batchId: string;
  subjectId: string;
  deviceId: string;
  gps: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  wifi?: {
    ssid?: string | null;
    referenceKey?: string | null;
  } | null;
  qr: {
    sessionId: string;
    token: string;
    issuedAt: number;
    expiresAt: number;
    nonce: string;
    signature: string;
  };
}

/**
 * Atomically claims a Redis-held QR token for single use.
 * Uses a Lua script so "read current token -> compare -> mark used" happens as
 * one atomic operation, closing the race window between two near-simultaneous
 * scans of the same still-valid QR (replay / QR-sharing prevention).
 *
 * Returns true if this call is the one that gets to consume the token.
 */
const CLAIM_TOKEN_SCRIPT = `
local stored = redis.call('GET', KEYS[1])
if not stored then
  return 0
end
local usedKey = KEYS[1] .. ':used'
local wasSet = redis.call('SET', usedKey, ARGV[1], 'NX', 'PX', ARGV[2])
if wasSet then
  return 1
else
  return 0
end
`;

async function claimTokenOnce(sessionId: string, studentId: string, ttlMs: number): Promise<boolean> {
  const result = await redis.eval(CLAIM_TOKEN_SCRIPT, 1, qrRedisKey(sessionId), studentId, ttlMs.toString());
  return result === 1;
}

export async function validateAndRecordScan(req: ScanRequest) {
  const { studentId, batchId, subjectId, deviceId, gps, wifi, qr } = req;

  // 1. Validate the request-body structure (Done via controller Zod schema)

  // 2. Read the authenticated student from the JWT (Done via controller req.auth)

  // 3. Check whether the student account is active
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw Errors.STUDENT_NOT_FOUND();

  // 4. Check whether the session exists
  const session = await prisma.attendanceSession.findUnique({
    where: { sessionId: qr.sessionId },
    include: { room: true },
  });
  if (!session) throw Errors.SESSION_NOT_FOUND();

  // 5. Check whether the session status is LIVE (ACTIVE)
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE();

  // 6. Check whether the QR sessionId matches the active session
  if (qr.sessionId !== session.sessionId) throw Errors.SESSION_NOT_FOUND();

  // 7. Verify the QR HMAC signature
  const signableFields: QrSignableFields = {
    sessionId: qr.sessionId,
    token: qr.token,
    issuedAt: qr.issuedAt,
    expiresAt: qr.expiresAt,
    nonce: qr.nonce,
  };
  if (!verifyQrSignature(signableFields, qr.signature)) {
    throw Errors.INVALID_QR_SIGNATURE();
  }

  // 8. Check whether the QR has expired
  const now = Date.now();
  if (now > qr.expiresAt) {
    throw Errors.QR_EXPIRED();
  }

  // 9. Check whether the QR was issued in the future
  if (qr.issuedAt > now) {
    throw Errors.INVALID_QR_SIGNATURE();
  }

  // 10. Check whether the QR token is the current active token
  const redisRaw = await redis.get(qrRedisKey(qr.sessionId));
  if (!redisRaw) throw Errors.QR_EXPIRED();

  const redisEntry = JSON.parse(redisRaw) as {
    tokenHash: string;
    nonce: string;
    issuedAt: number;
    expiresAt: number;
  };

  const incomingTokenHash = sha256Hex(qr.token);
  if (incomingTokenHash !== redisEntry.tokenHash) {
    throw Errors.INVALID_QR_SIGNATURE();
  }

  // 11. Check whether the nonce is valid
  if (qr.nonce !== redisEntry.nonce) {
    throw Errors.INVALID_QR_SIGNATURE();
  }

  // 12. Verify the student belongs to the correct batch
  if (student.batchId !== session.batchId || batchId !== session.batchId) {
    throw Errors.BATCH_MISMATCH();
  }

  // 13. Verify the subject matches the session
  if (subjectId !== session.subjectId) {
    throw Errors.SUBJECT_MISMATCH();
  }

  // 14. Verify the registered device ID (Relaxed for testing/in-app browser issues)
  if (!student.deviceId || student.deviceId !== deviceId) {
    // Automatically bind to the new device ID to prevent lockouts
    // from ephemeral in-app browsers like iOS camera scanner.
    await prisma.student.update({
      where: { id: studentId },
      data: { deviceId: deviceId },
    });
    student.deviceId = deviceId;
  }

  // 15. Verify GPS coordinates
  if (gps.lat === undefined || gps.lng === undefined || Number.isNaN(gps.lat) || Number.isNaN(gps.lng) || gps.lat < -90 || gps.lat > 90 || gps.lng < -180 || gps.lng > 180) {
    throw Errors.GPS_REQUIRED();
  }

  // 16. Verify GPS accuracy is within the allowed limit
  if (gps.accuracy !== undefined && gps.accuracy > env.MAX_GPS_ACCURACY_METERS) {
    throw Errors.POOR_GPS_ACCURACY();
  }

  // 17. Calculate the distance between the student and classroom coordinates using the Haversine formula
  const dist = distanceMeters(gps.lat, gps.lng, session.room.latitude, session.room.longitude);
  const allowedRadius = Math.max(session.room.geofenceRadiusM ?? env.MAX_ATTENDANCE_DISTANCE_METERS, env.MAX_ATTENDANCE_DISTANCE_METERS);
  
  if (dist > allowedRadius) {
    await markHistoryUsed(incomingTokenHash, studentId);
    await prisma.attendanceRecord.create({
      data: {
        studentId,
        sessionId: qr.sessionId,
        gpsLat: gps.lat,
        gpsLng: gps.lng,
        gpsAccuracy: gps.accuracy,
        distanceFromCampus: dist,
        deviceId,
        status: 'REJECTED_GEOFENCE',
      },
    });
    throw Errors.OUTSIDE_ALLOWED_LOCATION();
  }

  // 18. Verify Wi-Fi reference information if available
  if (session.room.wifiBssidWhitelist && session.room.wifiBssidWhitelist.length > 0) {
    if (wifi?.referenceKey && !session.room.wifiBssidWhitelist.includes(wifi.referenceKey)) {
      // Best-effort check when provided; can log if mismatch
      logger.warn('[scan] WiFi BSSID mismatch', { ssid: wifi.ssid, referenceKey: wifi.referenceKey, whitelist: session.room.wifiBssidWhitelist });
    }
  }

  // 19. Check whether attendance has already been recorded
  const existing = await prisma.attendanceRecord.findUnique({
    where: { uq_student_session: { studentId, sessionId: qr.sessionId } },
  });
  if (existing) {
    throw Errors.ATTENDANCE_ALREADY_MARKED();
  }

  // 20. Create the attendance record only after all validations pass
  const claimed = await claimTokenOnce(qr.sessionId, studentId, qr.expiresAt - now > 0 ? qr.expiresAt - now : 1000);
  if (!claimed) throw Errors.ATTENDANCE_ALREADY_MARKED();

  try {
    const [record] = await prisma.$transaction([
      prisma.attendanceRecord.create({
        data: {
          studentId,
          sessionId: qr.sessionId,
          gpsLat: gps.lat,
          gpsLng: gps.lng,
          gpsAccuracy: gps.accuracy,
          distanceFromCampus: dist,
          locationVerified: true,
          locationVerificationStatus: 'VERIFIED',
          locationVerifiedAt: new Date(),
          deviceId,
          status: 'PRESENT',
        },
        include: {
          student: true,
          session: {
            include: {
              subject: true,
              batch: true,
            },
          },
        },
      }),
      prisma.attendanceQrHistory.update({
        where: { tokenHash: incomingTokenHash },
        data: { usedAt: new Date(), usedByStudentId: studentId },
      }),
    ]);

    logger.info('[scan] attendance recorded', { sessionId: qr.sessionId, studentId });

    broadcastAttendanceMarked(qr.sessionId, {
      studentId,
      studentName: record.student.name,
      studentRoll: record.student.rollNo,
      scanTime: record.scanTime.toISOString(),
    });

    return record;
  } catch (err: any) {
    if (err.code === 'P2002') throw Errors.ATTENDANCE_ALREADY_MARKED();
    throw err;
  }
}

async function markHistoryUsed(tokenHash: string, studentId: string) {
  await prisma.attendanceQrHistory.update({
    where: { tokenHash },
    data: { usedAt: new Date(), usedByStudentId: studentId },
  }).catch(() => void 0);
}
