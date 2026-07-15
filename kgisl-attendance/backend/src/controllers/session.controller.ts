import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { startSession, endSession, pauseSession, resumeSession, getSessionStats, getSessionPublicInfo, getActiveSessionForFaculty, tickAndBroadcast } from '../services/session.service';
import { writeAuditLog, requestContext } from '../services/audit.service';
import { Errors } from '../utils/AppError';
import { prisma } from '../config/prisma';

const startSchema = z.object({
  subjectId: z.string().uuid(),
  roomId: z.string().uuid(),
  batchId: z.string().uuid(),
});

export async function startSessionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = startSchema.parse(req.body);
    const facultyId = req.auth!.sub;

    const session = await startSession({ facultyId, ...body });

    const ctx = requestContext(req);
    await writeAuditLog({
      actorId: facultyId,
      actorType: 'FACULTY',
      action: 'SESSION_STARTED',
      sessionId: session.sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: body,
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function endSessionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const facultyId = req.auth!.sub;

    const session = await endSession(sessionId, facultyId);

    const ctx = requestContext(req);
    await writeAuditLog({
      actorId: facultyId,
      actorType: 'FACULTY',
      action: 'SESSION_ENDED',
      sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function pauseSessionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const facultyId = req.auth!.sub;

    const session = await pauseSession(sessionId, facultyId);

    const ctx = requestContext(req);
    await writeAuditLog({
      actorId: facultyId,
      actorType: 'FACULTY',
      action: 'SESSION_PAUSED',
      sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function resumeSessionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const facultyId = req.auth!.sub;

    const session = await resumeSession(sessionId, facultyId);

    const ctx = requestContext(req);
    await writeAuditLog({
      actorId: facultyId,
      actorType: 'FACULTY',
      action: 'SESSION_RESUMED',
      sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function getSessionStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const stats = await getSessionStats(sessionId);
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getActiveSessionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const facultyId = req.auth!.sub;
    const session = await getActiveSessionForFaculty(facultyId);
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

/**
 * Deliberately minimal, non-sensitive lookup: tells a scanning student's app
 * which batch/subject a sessionId (decoded from the QR) belongs to, so the
 * client can send batchIdClaimed/subjectIdClaimed alongside the QR token.
 * This is safe to expose because the QR itself never carries attendance
 * data (per spec) — the sessionId alone grants no ability to mark attendance
 * without also passing every other check in the validation pipeline.
 */
export async function getSessionPublicInfoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const info = await getSessionPublicInfo(sessionId);
    res.status(200).json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
}

import { markManualAttendance } from '../services/attendance.service';
import { broadcastAttendanceMarked } from '../websocket/socket';
import { sendAttendanceNotification } from '../services/whatsapp.service';
import { logger } from '../utils/logger';

const manualAttendanceSchema = z.object({
  rollNo: z.string().min(1),
});

export async function manualAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const { rollNo } = manualAttendanceSchema.parse(req.body);
    const facultyId = req.auth!.sub;

    const { record, student } = await markManualAttendance({ sessionId, rollNo, facultyId });

    broadcastAttendanceMarked(sessionId, {
      studentId: student.id,
      studentName: student.name,
      studentRoll: student.rollNo,
      scanTime: record.scanTime.toISOString(),
    });

    // Fire-and-forget WhatsApp notification
    sendAttendanceNotification(record).catch((err) => {
      logger.error('[manual-attendance] WhatsApp notification failed to dispatch', { error: err.message });
    });

    const ctx = requestContext(req);
    await writeAuditLog({
      actorId: facultyId,
      actorType: 'FACULTY',
      action: 'MANUAL_ATTENDANCE_MARKED',
      sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { rollNo },
    });

    res.status(201).json({ success: true, message: 'Attendance marked manually' });
  } catch (err) {
    next(err);
  }
}

export async function refreshSessionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { sessionId } = req.params;
    const facultyId = req.auth!.sub;

    const session = await prisma.attendanceSession.findUnique({ where: { sessionId } });
    if (!session) throw Errors.SESSION_NOT_FOUND();
    if (session.facultyId !== facultyId) throw Errors.SESSION_NOT_ACTIVE();
    if (session.status !== 'ACTIVE') throw Errors.SESSION_NOT_ACTIVE();

    await tickAndBroadcast(sessionId);

    const ctx = requestContext(req);
    await writeAuditLog({
      actorId: facultyId,
      actorType: 'FACULTY',
      action: 'SESSION_QR_REFRESHED',
      sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    res.status(200).json({ success: true, message: 'Session QR code regenerated successfully' });
  } catch (err) {
    next(err);
  }
}
