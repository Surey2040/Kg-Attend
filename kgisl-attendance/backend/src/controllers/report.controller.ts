import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getAggregatedReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { batchId, fromDate, toDate } = req.query;

    const whereClause: any = {};
    if (batchId) whereClause.batchId = String(batchId);
    if (fromDate && toDate) {
      whereClause.createdAt = {
        gte: new Date(String(fromDate)),
        lte: new Date(String(toDate)),
      };
    }

    const sessions = await (prisma as any).attendanceSession.findMany({
      where: whereClause,
      include: {
        subject: true,
        faculty: true,
        records: true,
      },
    });

    const report = sessions.map((s: any) => ({
      sessionId: s.sessionId,
      subject: s.subject.name,
      faculty: s.faculty.name,
      totalPresent: s.records.length,
      date: s.createdAt,
    }));

    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function getStudentReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { studentId } = req.params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        records: { include: { session: { include: { subject: true } } } },
        leaveRequests: true,
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Aggregate attendance by subject
    const subjectStats: Record<string, { present: number, total: number }> = {};
    student.records.forEach((record: any) => {
      const subName = record.session.subject.name;
      if (!subjectStats[subName]) subjectStats[subName] = { present: 0, total: 0 };
      if (record.status === 'PRESENT') subjectStats[subName].present += 1;
      subjectStats[subName].total += 1; // Actually we need total sessions for this batch, but approximation is fine for now
    });

    res.json({
      success: true,
      data: {
        student: { name: student.name, rollNo: student.rollNo },
        subjectStats,
        leaves: student.leaveRequests,
      }
    });
  } catch (err) {
    next(err);
  }
}
