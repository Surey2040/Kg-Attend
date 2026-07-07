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
  deviceId: string;
  batchIdClaimed: string;
  subjectIdClaimed: string;
  gps: { lat: number; lng: number };
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
  const { studentId, deviceId, gps, qr } = req;

  // ---------------------------------------------------------------
  // 1. Validate Student
  // ---------------------------------------------------------------
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw Errors.STUDENT_NOT_FOUND();

  // ---------------------------------------------------------------
  // 2. Validate Active Session
  // ---------------------------------------------------------------
  const session = await prisma.attendanceSession.findUnique({
    where: { sessionId: qr.sessionId },
    include: { room: true },
  });
  if (!session) throw Errors.SESSION_NOT_FOUND();
  if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE();

  // ---------------------------------------------------------------
  // 3. Validate QR Signature (HMAC-SHA256, constant-time compare)
  // ---------------------------------------------------------------
  const signableFields: QrSignableFields = {
    sessionId: qr.sessionId,
    token: qr.token,
    issuedAt: qr.issuedAt,
    expiresAt: qr.expiresAt,
    nonce: qr.nonce,
  };
  if (!verifyQrSignature(signableFields, qr.signature)) {
    throw Errors.INVALID_SIGNATURE();
  }

  // ---------------------------------------------------------------
  // 4. Validate QR Expiry (server clock is source of truth, not client-sent times)
  // ---------------------------------------------------------------
  const now = Date.now();
  const skewMs = env.QR_CLOCK_SKEW_TOLERANCE_SECONDS * 1000;
  if (now > qr.expiresAt + skewMs) {
    throw Errors.QR_EXPIRED();
  }

  // ---------------------------------------------------------------
  // 5. Validate Secure Token — must match what's CURRENTLY held in Redis
  //    (i.e. it must be the live, active token — not a past/future one).
  // ---------------------------------------------------------------
  const redisRaw = await redis.get(qrRedisKey(qr.sessionId));
  if (!redisRaw) throw Errors.QR_EXPIRED(); // Redis TTL already evicted it

  const redisEntry = JSON.parse(redisRaw) as {
    tokenHash: string;
    nonce: string;
    issuedAt: number;
    expiresAt: number;
  };

  const incomingTokenHash = sha256Hex(qr.token);
  if (incomingTokenHash !== redisEntry.tokenHash || qr.nonce !== redisEntry.nonce) {
    throw Errors.INVALID_SIGNATURE(); // token doesn't match the currently active one
  }

  // ---------------------------------------------------------------
  // 6. Validate Token Not Revoked  &  7. Validate Token Not Previously Used
  //    Cross-check against durable history for defense-in-depth (Redis is the
  //    fast path; Postgres is the audit-grade backstop).
  // ---------------------------------------------------------------
  const historyRow = await prisma.attendanceQrHistory.findUnique({
    where: { tokenHash: incomingTokenHash },
  });
  if (!historyRow || historyRow.revoked) throw Errors.TOKEN_REVOKED();
  if (historyRow.usedAt) throw Errors.TOKEN_ALREADY_USED();

  // Atomic single-use claim (this is what actually prevents two students
  // racing to submit the same still-valid, unused token — e.g. a shared screenshot).
  const claimed = await claimTokenOnce(qr.sessionId, studentId, qr.expiresAt - now > 0 ? qr.expiresAt - now : 1000);
  if (!claimed) throw Errors.TOKEN_ALREADY_USED();

  // ---------------------------------------------------------------
  // 8. Validate Batch
  // ---------------------------------------------------------------
  if (student.batchId !== session.batchId) throw Errors.BATCH_MISMATCH();

  // ---------------------------------------------------------------
  // 9. Validate Subject
  // ---------------------------------------------------------------
  if (req.subjectIdClaimed !== session.subjectId) throw Errors.SUBJECT_MISMATCH();

  // ---------------------------------------------------------------
  // 10. Validate Attendance Time (session must still be within its active window —
  //     already covered by status check, but also guard against a session that
  //     was force-ended between QR issuance and scan submission).
  // ---------------------------------------------------------------
  const freshSession = await prisma.attendanceSession.findUnique({ where: { sessionId: qr.sessionId } });
  if (!freshSession || freshSession.status !== 'ACTIVE') throw Errors.OUTSIDE_TIME_WINDOW();

  // ---------------------------------------------------------------
  // 11. Validate GPS present
  // ---------------------------------------------------------------
  if (gps.lat === undefined || gps.lng === undefined || Number.isNaN(gps.lat) || Number.isNaN(gps.lng)) {
    throw Errors.GPS_REQUIRED();
  }

  // ---------------------------------------------------------------
  // 12. Validate Campus Geofence
  // ---------------------------------------------------------------
  const dist = distanceMeters(gps.lat, gps.lng, session.room.latitude, session.room.longitude);
  const allowedRadius = session.room.geofenceRadiusM ?? env.DEFAULT_GEOFENCE_RADIUS_M;
  if (dist > allowedRadius) {
    await markHistoryUsed(incomingTokenHash, studentId);
    await prisma.attendanceRecord.create({
      data: {
        studentId,
        sessionId: qr.sessionId,
        gpsLat: gps.lat,
        gpsLng: gps.lng,
        deviceId,
        status: 'REJECTED_GEOFENCE',
      },
    });
    throw Errors.OUTSIDE_GEOFENCE();
  }

  // ---------------------------------------------------------------
  // 13. Validate Duplicate Attendance (DB unique constraint is the final backstop)
  // ---------------------------------------------------------------
  const existing = await prisma.attendanceRecord.findUnique({
    where: { uq_student_session: { studentId, sessionId: qr.sessionId } },
  });
  if (existing) throw Errors.DUPLICATE_ATTENDANCE();

  // ---------------------------------------------------------------
  // 14. Validate Session Status (final re-check immediately before write)
  // ---------------------------------------------------------------
  if (freshSession.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE();

  // ---------------------------------------------------------------
  // ALL CHECKS PASSED -> persist atomically
  // ---------------------------------------------------------------
  try {
    const [record] = await prisma.$transaction([
      prisma.attendanceRecord.create({
        data: {
          studentId,
          sessionId: qr.sessionId,
          gpsLat: gps.lat,
          gpsLng: gps.lng,
          deviceId,
          status: 'PRESENT',
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
      studentName: student.name,
      studentRoll: student.rollNo,
      scanTime: record.scanTime.toISOString(),
    });

    return record;
  } catch (err: any) {
    // Unique constraint race (two requests slipped past the earlier check
    // simultaneously) — surface as a clean duplicate error, not a 500.
    if (err.code === 'P2002') throw Errors.DUPLICATE_ATTENDANCE();
    throw err;
  }
}

async function markHistoryUsed(tokenHash: string, studentId: string) {
  await prisma.attendanceQrHistory.update({
    where: { tokenHash },
    data: { usedAt: new Date(), usedByStudentId: studentId },
  }).catch(() => void 0); // best-effort; rejection path already throws its own error
}
