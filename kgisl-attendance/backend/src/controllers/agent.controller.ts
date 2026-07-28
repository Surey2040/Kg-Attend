import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export async function handleAgentChat(req: Request, res: Response): Promise<void> {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ reply: "Please provide a valid query." });
      return;
    }

    const trimmedMsg = message.trim();
    const lowerMessage = trimmedMsg.toLowerCase();

    // Extract potential roll numbers, names, or search keywords
    const words = trimmedMsg.split(/[\s,]+/);

    // 1. Student Lookup by Roll Number or Student Name
    let foundStudent: any = null;

    for (const word of words) {
      if (word.length >= 2) {
        try {
          const student = await prisma.student.findFirst({
            where: {
              OR: [
                { rollNo: { contains: word, mode: 'insensitive' } },
                { name: { contains: word, mode: 'insensitive' } },
              ],
            },
            include: {
              batch: true,
              records: {
                include: {
                  session: {
                    include: { subject: true, room: true },
                  },
                },
                orderBy: { scanTime: 'desc' },
              },
              leaveRequests: {
                orderBy: { createdAt: 'desc' },
              },
            },
          });

          if (student) {
            foundStudent = student;
            break;
          }
        } catch (e) {
          // Fallback if query fails
        }
      }
    }

    // If student found, build clean, structured key-value audit profile (EXCEPT sensitive deviceId)
    if (foundStudent) {
      const student = foundStudent;

      // Safely check monthly signatures table if available
      let monthlySig: any = null;
      try {
        const sigs = await (prisma as any).monthlyAttendanceSignature.findMany({
          where: { studentId: student.id },
          orderBy: { signedAt: 'desc' },
        });
        monthlySig = sigs && sigs.length > 0 ? sigs[0] : null;
      } catch (err) {
        monthlySig = null;
      }

      // Count total ended sessions for student's batch
      const endedSessionsCount = await prisma.attendanceSession.count({
        where: { batchId: student.batchId },
      });
      const totalSessions = Math.max(endedSessionsCount, student.records.length);
      const presentSessions = student.records.filter((r: any) => r.status === 'PRESENT').length;
      const percentage = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 100;
      const isEligible = percentage >= 75;

      // Monthly Signature Audit status check (e.g. July 2026 or latest month)
      const currentMonthStr = 'July 2026';
      const hasSignedMonthly = !!monthlySig && monthlySig.status === 'SIGNED';

      // Leave summary
      const pendingLeaves = student.leaveRequests.filter((l: any) => l.status === 'PENDING').length;
      const approvedLeaves = student.leaveRequests.filter((l: any) => l.status === 'APPROVED').length;

      let reply = `[HEADER] Student Profile & Audit Summary\n`;
      reply += `Name: ${student.name}\n`;
      reply += `Roll Number: ${student.rollNo}\n`;
      reply += `Section / Batch: ${student.batch?.name || 'N/A'}\n`;
      reply += `Email: ${student.email}\n`;
      reply += `Phone / WhatsApp: ${student.phone || 'Not registered'}\n`;
      reply += `Trust Score: ${student.trustScore}/100\n\n`;

      reply += `[SECTION] Attendance Performance\n`;
      reply += `Overall Attendance: ${percentage}% (${presentSessions} Present / ${totalSessions} Total Sessions)\n`;
      reply += `Exam Eligibility: ${isEligible ? 'ELIGIBLE (≥75%)' : 'SHORTAGE ALERT (<75%)'}\n\n`;

      reply += `[SECTION] Monthly Digital Signature Audit\n`;
      if (hasSignedMonthly) {
        reply += `Signature Status: SIGNED & VERIFIED (${monthlySig.month})\n`;
        reply += `Signed Date: ${new Date(monthlySig.signedAt).toLocaleString('en-GB')}\n`;
        reply += `Verification Hash: ${monthlySig.hash}\n\n`;
      } else {
        reply += `Signature Status: NOT SIGNED / PENDING (${currentMonthStr})\n`;
        reply += `Action Required: Student sign-off pending via iOS Pen tool.\n\n`;
      }

      reply += `[SECTION] Leave / On-Duty Status\n`;
      reply += `Pending Requests: ${pendingLeaves} | Approved: ${approvedLeaves}\n`;

      if (student.records.length > 0) {
        reply += `\n[SECTION] Recent Class Check-ins\n`;
        const recentScans = student.records.slice(0, 4);
        recentScans.forEach((r: any) => {
          const statusIcon = r.status === 'PRESENT' ? 'PRESENT' : 'ABSENT';
          const timeStr = new Date(r.scanTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          reply += `${r.session?.subject?.code || 'CLASS'} (${r.session?.subject?.name || 'Session'}): ${statusIcon} - ${timeStr}\n`;
        });
      }

      res.json({ reply });
      return;
    }

    // 2. Active Sessions Query
    if (lowerMessage.includes('active') || lowerMessage.includes('live')) {
      const activeSessions = await prisma.attendanceSession.findMany({
        where: { status: 'ACTIVE' },
        include: { subject: true, batch: { include: { students: true } }, room: true, faculty: true, records: true },
      });

      if (activeSessions.length === 0) {
        res.json({ reply: "There are currently no active attendance sessions running on campus." });
        return;
      }

      let reply = `[HEADER] Live Campus Status\nActive Sessions Count: ${activeSessions.length}\n\n`;
      activeSessions.forEach((s) => {
        const expected = s.batch.students.length;
        const present = s.records.filter((r) => r.status === 'PRESENT').length;
        reply += `Subject: ${s.subject.name} (${s.batch.name})\nFaculty: ${s.faculty.name}\nRoom: ${s.room.name}\nAttendance: ${present}/${expected} Present\n\n`;
      });
      res.json({ reply });
      return;
    }

    // 3. Today's Summary
    if (lowerMessage.includes('today') || lowerMessage.includes('summary')) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todaysSessions = await prisma.attendanceSession.findMany({
        where: { startedAt: { gte: startOfDay } },
        include: { records: true, batch: { include: { students: true } } },
      });

      if (todaysSessions.length === 0) {
        res.json({ reply: "No attendance sessions have been conducted today." });
        return;
      }

      let totalStudents = 0;
      let totalPresent = 0;

      todaysSessions.forEach((session) => {
        totalStudents += session.batch.students.length;
        const presentCount = session.records.filter((r) => r.status === 'PRESENT').length;
        totalPresent += presentCount;
      });

      const percentage = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

      res.json({
        reply: `[HEADER] Today's Campus Attendance Summary\nSessions Conducted: ${todaysSessions.length}\nTotal Check-ins: ${totalPresent} / ${totalStudents}\nCampus Attendance: ${percentage}%`,
      });
      return;
    }

    // Default Fallback Guide
    res.json({
      reply: "I am your Genius AI Assistant. Type any Student Roll Number or Name to view their complete audit profile!\n\nExamples:\n• 25MCA110 or Surender\n• 25MCA100 or Akshith\n• active (for live sessions)\n• today (for daily summary)",
    });
  } catch (error: any) {
    logger.error('Agent chat error', { error: error.message });
    res.status(500).json({ reply: "Sorry, I ran into an internal error while analyzing the data." });
  }
}
