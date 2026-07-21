import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateAndRecordScan } from '../services/validation.service';
import { writeAuditLog, requestContext } from '../services/audit.service';
import { AppError } from '../utils/AppError';

const scanSchema = z.object({
  batchId: z.string().uuid(),
  subjectId: z.string().uuid(),
  deviceId: z.string().min(1),
  gps: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    accuracy: z.number().optional(),
  }),
  wifi: z.object({
    ssid: z.string().optional().nullable(),
    referenceKey: z.string().optional().nullable(),
  }).optional().nullable(),
  qr: z.object({
    sessionId: z.string().uuid(),
    token: z.string().min(20),
    issuedAt: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
    nonce: z.string().min(1),
    signature: z.string().min(10),
  }),
});

export async function scanHandler(req: Request, res: Response, next: NextFunction) {
  const ctx = requestContext(req);
  const studentId = req.auth?.sub;

  try {
    const body = scanSchema.parse(req.body);

    const record = await validateAndRecordScan({
      studentId: studentId!,
      batchId: body.batchId,
      subjectId: body.subjectId,
      deviceId: body.deviceId,
      gps: body.gps,
      wifi: body.wifi,
      qr: body.qr,
    });

    await writeAuditLog({
      actorId: studentId,
      actorType: 'STUDENT',
      action: 'SCAN_ACCEPTED',
      sessionId: body.qr.sessionId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { gps: body.gps },
    });

    res.status(201).json({
      success: true,
      code: 'ATTENDANCE_MARKED',
      message: 'Attendance marked successfully.',
      data: {
        attendanceId: record.id,
        sessionId: record.sessionId,
        studentId: record.studentId,
        studentName: record.student.name,
        rollNo: record.student.rollNo,
        sessionName: record.session.batch.name,
        subjectName: record.session.subject.name,
        status: record.status,
        markedAt: record.scanTime.toISOString(),
        distance: Math.round(record.distanceFromCampus || 0),
        locationStatus: record.locationVerified ? 'VERIFIED' : 'PENDING'
      },
    });
  } catch (err) {
    // Every rejection reason (expired QR, geofence, duplicate, signature, etc.) is
    // captured here via the AppError code — full audit trail without touching the
    // validation pipeline's own logic/control-flow at all.
    await writeAuditLog({
      actorId: studentId,
      actorType: 'STUDENT',
      action: 'SCAN_REJECTED',
      success: false,
      reasonCode: err instanceof AppError ? err.code : 'UNKNOWN_ERROR',
      sessionId: (req.body?.qr?.sessionId as string) ?? null,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    next(err);
  }
}
