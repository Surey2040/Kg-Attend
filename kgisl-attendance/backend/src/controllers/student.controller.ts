import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { getAcademicYearConfig } from './academicYear.controller';

export async function listStudentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const batchId = req.query.batchId as string | undefined;

    const whereClause: any = {};
    if (batchId) whereClause.batchId = batchId;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        batch: true,
        records: {
          where: { status: 'PRESENT' },
          orderBy: { scanTime: 'desc' },
        },
      },
      orderBy: { rollNo: 'asc' },
    });

    const academicConfig = await getAcademicYearConfig();
    const TOTAL_SEMESTER_DAYS = academicConfig.totalWorkingDays || 90;

    const studentListWithStats = students.map((student) => {
      const attendedSessions = student.records.length;
      const percentage = Math.min(100, Math.round((attendedSessions / TOTAL_SEMESTER_DAYS) * 100));

      const lastScan = student.records[0];

      return {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        email: student.email,
        batchName: student.batch.name,
        lastScanTime: lastScan ? lastScan.scanTime : null,
        attendancePercentage: percentage,
        totalSessions: TOTAL_SEMESTER_DAYS,
        attendedSessions,
      };
    });

    res.json({ success: true, data: studentListWithStats });
  } catch (err) {
    next(err);
  }
}

export async function resetStudentDeviceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.params.id;
    await prisma.student.update({
      where: { id: studentId },
      data: { deviceId: null },
    });
    res.json({ success: true, message: 'Student device binding reset successfully' });
  } catch (err) {
    next(err);
  }
}
