import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export async function getLiveCampusData(_req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSessions = await prisma.attendanceSession.findMany({
      where: { startedAt: { gte: today } },
      include: {
        faculty: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        room: { select: { name: true } },
        batch: {
          include: {
            students: {
              select: { id: true, rollNo: true, name: true }
            }
          }
        },
        records: {
          where: { status: 'PRESENT' },
          select: { studentId: true }
        }
      }
    });

    let totalExpected = 0;
    let totalPresent = 0;

    const formattedSessions = activeSessions.map(session => {
      const presentStudentIds = new Set(session.records.map(r => r.studentId));
      const students = session.batch.students.map(s => {
        const isPresent = presentStudentIds.has(s.id);
        return {
          id: s.id,
          rollNo: s.rollNo,
          name: s.name,
          isPresent
        };
      });

      // Sort students by roll number so the GitHub grid is consistent
      students.sort((a, b) => a.rollNo.localeCompare(b.rollNo));

      const expected = students.length;
      const present = session.records.length;
      
      totalExpected += expected;
      totalPresent += present;

      return {
        sessionId: session.sessionId,
        status: session.status,
        facultyName: session.faculty.name,
        subjectName: session.subject.name,
        roomName: session.room.name,
        batchName: session.batch.name,
        stats: {
          expected,
          present,
          absent: expected - present
        },
        students // The raw array for the Github contribution grid
      };
    });

    res.json({
      success: true,
      data: {
        overall: {
          totalSessions: activeSessions.length,
          totalExpected,
          totalPresent,
          totalAbsent: totalExpected - totalPresent
        },
        sessions: formattedSessions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch live campus data' });
  }
}
