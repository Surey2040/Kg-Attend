import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getAggregatedReport(req: Request, res: Response, next: NextFunction): Promise<void> {
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

export async function getStudentReport(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      res.status(404).json({ success: false, message: 'Student not found' });
      return;
    }

    // Aggregate attendance by subject
    const subjectStats: Record<string, { present: number, total: number }> = {};
    student.records.forEach((record: any) => {
      const subName = record.session.subject.name;
      if (!subjectStats[subName]) subjectStats[subName] = { present: 0, total: 0 };
      if (record.status === 'PRESENT') subjectStats[subName].present += 1;
      subjectStats[subName].total += 1;
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

async function getStudentStats() {
  const students = await prisma.student.findMany({
    include: {
      batch: true,
      records: { where: { status: 'PRESENT' } },
    },
    orderBy: { rollNo: 'asc' },
  });

  const endedSessions = await prisma.attendanceSession.findMany({
    select: { batchId: true },
  });

  const sessionsCountByBatch = endedSessions.reduce((acc: Record<string, number>, s) => {
    acc[s.batchId] = (acc[s.batchId] || 0) + 1;
    return acc;
  }, {});

  return students.map((student) => {
    const totalBatchSessions = sessionsCountByBatch[student.batchId] || 0;
    const attendedSessions = student.records.length;
    const percentage = totalBatchSessions > 0 
      ? Math.round((attendedSessions / totalBatchSessions) * 100) 
      : 100;

    return {
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      batchName: student.batch.name,
      percentage,
      totalSessions: totalBatchSessions,
      attendedSessions,
    };
  });
}

export async function getLowAttendanceReport(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getStudentStats();
    const lowAttendance = stats.filter(s => s.percentage < 75);
    res.json({ success: true, data: lowAttendance });
  } catch (err) {
    next(err);
  }
}

export async function exportAttendanceCSV(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await getStudentStats();
    
    // Build CSV content
    const headers = ['Roll No', 'Name', 'Batch', 'Attended', 'Total Sessions', 'Percentage'];
    const rows = stats.map(s => [
      s.rollNo,
      `"${s.name}"`, // Quote name in case of commas
      `"${s.batchName}"`,
      s.attendedSessions,
      s.totalSessions,
      `${s.percentage}%`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
