import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { sendFacultySignatureReportEmail } from '../services/email.service';

export async function submitMonthlySignatureHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = (req as any).user?.id || req.body.studentId;
    const { month, signatureDataUrl, hash, attendancePercentage, totalConducted, attendedCount } = req.body;

    if (!studentId) {
      res.status(401).json({ success: false, message: 'Student ID is required' });
      return;
    }
    if (!month || !signatureDataUrl) {
      res.status(400).json({ success: false, message: 'Month and signatureDataUrl are required' });
      return;
    }

    const currentMonth = month || '2026-07';
    const sigHash = hash || ('SIG-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase());

    const savedRecord = await prisma.monthlyAttendanceSignature.upsert({
      where: {
        studentId_month: {
          studentId,
          month: currentMonth,
        },
      },
      update: {
        signatureDataUrl,
        hash: sigHash,
        attendancePercentage: Number(attendancePercentage || 0),
        totalConducted: Number(totalConducted || 0),
        attendedCount: Number(attendedCount || 0),
        signedAt: new Date(),
        status: 'SIGNED',
      },
      create: {
        studentId,
        month: currentMonth,
        signatureDataUrl,
        hash: sigHash,
        attendancePercentage: Number(attendancePercentage || 0),
        totalConducted: Number(totalConducted || 0),
        attendedCount: Number(attendedCount || 0),
        status: 'SIGNED',
      },
    });

    res.json({
      success: true,
      message: 'Monthly attendance signature saved to database successfully',
      data: savedRecord,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudentMonthlySignatureHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = (req as any).user?.id || (req.query.studentId as string);
    const month = (req.query.month as string) || '2026-07';

    if (!studentId) {
      res.status(400).json({ success: false, message: 'Student ID is required' });
      return;
    }

    const signatureRecord = await prisma.monthlyAttendanceSignature.findUnique({
      where: {
        studentId_month: {
          studentId,
          month,
        },
      },
    });

    res.json({
      success: true,
      data: signatureRecord || null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFacultyMonthlySignaturesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facultyId = (req as any).user?.id;
    let batchId = req.query.batchId as string | undefined;
    const month = (req.query.month as string) || '2026-07';

    // If batchId is not explicitly provided, find the batch allocated to this faculty
    if (!batchId && facultyId) {
      const allocation = await prisma.timetableAllocation.findFirst({
        where: { facultyId },
        select: { batchId: true },
      });
      if (allocation) {
        batchId = allocation.batchId;
      }
    }

    // If still no batchId, fetch first batch
    if (!batchId) {
      const firstBatch = await prisma.batch.findFirst();
      batchId = firstBatch?.id;
    }

    if (!batchId) {
      res.json({
        success: true,
        data: {
          batchName: 'N/A',
          month,
          totalStudents: 0,
          signedCount: 0,
          pendingCount: 0,
          students: [],
        },
      });
      return;
    }

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    const students = await prisma.student.findMany({
      where: { batchId },
      include: {
        monthlySignatures: {
          where: { month },
        },
        records: {
          where: { status: 'PRESENT' },
        },
      },
      orderBy: { rollNo: 'asc' },
    });

    const totalConducted = 90;

    let signedCount = 0;
    let pendingCount = 0;

    const studentList = students.map((s) => {
      const sig = s.monthlySignatures[0];
      const attendedCount = s.records.length;
      const pct = Math.min(100, Math.round((attendedCount / totalConducted) * 100));
      const isSigned = !!sig && sig.status === 'SIGNED';

      if (isSigned) {
        signedCount++;
      } else {
        pendingCount++;
      }

      return {
        id: s.id,
        rollNo: s.rollNo,
        studentName: s.name,
        email: s.email,
        attendancePercentage: sig ? sig.attendancePercentage : pct,
        totalConducted: sig ? sig.totalConducted : totalConducted,
        attendedCount: sig ? sig.attendedCount : attendedCount,
        status: isSigned ? 'SIGNED' : 'PENDING',
        signedAt: sig ? sig.signedAt.toLocaleString('en-GB') : undefined,
        signatureDataUrl: sig ? sig.signatureDataUrl : undefined,
        hash: sig ? sig.hash : undefined,
      };
    });

    res.json({
      success: true,
      data: {
        batchId,
        batchName: batch?.name || 'Section C',
        month,
        totalStudents: students.length,
        signedCount,
        pendingCount,
        students: studentList,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function sendFacultyMonthlySignatureEmailHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facultyId = (req as any).user?.id;
    const { batchId, month, facultyEmail } = req.body;

    const currentMonth = month || '2026-07';

    // Get faculty info
    let faculty = null;
    if (facultyId) {
      faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    }

    const targetEmail = facultyEmail || faculty?.email || 'faculty@kgisl.ac.in';
    const targetFacultyName = faculty?.name || 'Class Tutor';

    // Fetch batch data
    const targetBatchId = batchId || (await prisma.batch.findFirst())?.id;
    if (!targetBatchId) {
      res.status(400).json({ success: false, message: 'Batch not found' });
      return;
    }

    const batch = await prisma.batch.findUnique({ where: { id: targetBatchId } });
    const students = await prisma.student.findMany({
      where: { batchId: targetBatchId },
      include: {
        monthlySignatures: { where: { month: currentMonth } },
        records: { where: { status: 'PRESENT' } },
      },
      orderBy: { rollNo: 'asc' },
    });

    const endedSessions = await prisma.attendanceSession.count({ where: { batchId: targetBatchId } });
    const totalConducted = Math.max(endedSessions, 24);

    let signedCount = 0;
    let pendingCount = 0;

    const studentList = students.map((s) => {
      const sig = s.monthlySignatures[0];
      const attendedCount = s.records.length;
      const pct = totalConducted > 0 ? Math.round((attendedCount / totalConducted) * 100) : 100;
      const isSigned = !!sig && sig.status === 'SIGNED';

      if (isSigned) signedCount++;
      else pendingCount++;

      return {
        studentName: s.name,
        rollNo: s.rollNo,
        email: s.email,
        attendancePercentage: sig ? sig.attendancePercentage : pct,
        totalConducted: sig ? sig.totalConducted : totalConducted,
        attendedCount: sig ? sig.attendedCount : attendedCount,
        status: isSigned ? 'SIGNED' : 'PENDING',
        signedAt: sig ? sig.signedAt.toLocaleString('en-GB') : undefined,
        signatureDataUrl: sig ? sig.signatureDataUrl : undefined,
        hash: sig ? sig.hash : undefined,
      };
    });

    const emailResult = await sendFacultySignatureReportEmail({
      toEmail: targetEmail,
      facultyName: targetFacultyName,
      batchName: batch?.name || 'Section C',
      month: currentMonth,
      totalStudents: students.length,
      signedCount,
      pendingCount,
      students: studentList,
    });

    res.json({
      success: true,
      message: emailResult.message,
      simulated: emailResult.simulated,
    });
  } catch (err) {
    next(err);
  }
}
