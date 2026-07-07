import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateAndRecordScan } from '../services/validation.service';
import { writeAuditLog, requestContext } from '../services/audit.service';
import { AppError } from '../utils/AppError';

const scanSchema = z.object({
  batchId: z.string().uuid(),
  subjectId: z.string().uuid(),
  gps: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  qr: z.object({
    sessionId: z.string().uuid(),
    token: z.string().min(20),
    issuedAt: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
    nonce: z.string().length(32), // 16 bytes hex
    signature: z.string().min(10),
  }),
});

export async function scanHandler(req: Request, res: Response, next: NextFunction) {
  const ctx = requestContext(req);
  const studentId = req.auth?.sub;

  try {
    const body = scanSchema.parse(req.body);
    const deviceId = req.auth!.deviceId ?? req.headers['x-device-id']?.toString() ?? 'unknown';

    const record = await validateAndRecordScan({
      studentId: studentId!,
      deviceId,
      batchIdClaimed: body.batchId,
      subjectIdClaimed: body.subjectId,
      gps: body.gps,
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
      message: 'Attendance marked successfully',
      data: { id: record.id, scanTime: record.scanTime, status: record.status },
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
