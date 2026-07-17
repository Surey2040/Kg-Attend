import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { markAttendance } from '../services/attendance.service';

const scanSchema = z.object({
  qrPayload: z.any(),
  gpsLat: z.number(),
  gpsLng: z.number(),
  gpsAccuracy: z.number().optional(),
  deviceId: z.string(),
});

export async function scanAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const body = scanSchema.parse(req.body);

    const result = await markAttendance({
      studentId: req.auth!.sub,
      qrPayload: body.qrPayload,
      gpsLat: body.gpsLat,
      gpsLng: body.gpsLng,
      gpsAccuracy: body.gpsAccuracy,
      deviceId: body.deviceId,
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

import { getTodayAttendanceForFaculty, getAllTodayAttendance } from '../services/attendance.service';
import { prisma } from '../config/prisma';

export async function getTodayAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.auth!.sub;
    const isRoleAdmin = req.auth!.role === 'ADMIN';
    
    // Check if the user is Admin (backward compatibility if admin logs in as faculty)
    let isAdmin = isRoleAdmin;
    if (!isAdmin) {
      const faculty = await prisma.faculty.findUnique({ where: { id: userId } });
      isAdmin = faculty?.email === 'admin@kgisliim.ac.in';
    }

    const records = isAdmin 
      ? await getAllTodayAttendance()
      : await getTodayAttendanceForFaculty(userId);

    // Map to match the shape of WebSocket 'attendance_marked' event payload
    const formattedScans = records.map(r => ({
      studentId: r.student.id,
      studentName: r.student.name,
      studentRoll: r.student.rollNo,
      scanTime: r.scanTime.toISOString(),
      isViolation: !r.locationVerified || r.status !== 'PRESENT',
    }));

    res.status(200).json({ success: true, data: formattedScans });
  } catch (err) {
    next(err);
  }
}
