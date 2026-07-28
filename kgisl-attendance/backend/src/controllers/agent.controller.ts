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

    // First try matching full message or individual words against Student Roll No or Name
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
          // Fallback if individual word query fails
        }
      }
    }

    // If student found, build an exhaustive, beautifully formatted audit profile (EXCEPT sensitive deviceId)
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

      let reply = `🎓 **Student Complete Profile & Audit Summary:**\n`;
      reply += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reply += `👤 **Name:** ${student.name}\n`;
      reply += `🆔 **Roll Number:** \`${student.rollNo}\`\n`;
      reply += `🏫 **Section / Batch:** ${student.batch?.name || 'N/A'}\n`;
      reply += `📧 **Email:** ${student.email}\n`;
      reply += `📱 **Phone / WhatsApp:** ${student.phone || 'Not registered'}\n`;
      reply += `🛡️ **Trust Score:** ${student.trustScore}/100\n\n`;

      reply += `📊 **Attendance Performance:**\n`;
      reply += `• **Overall Attendance:** **${percentage}%** (${presentSessions} Present out of ${totalSessions} Total Sessions)\n`;
      reply += `• **Exam Eligibility:** ${isEligible ? '🟢 **ELIGIBLE** (≥75%)' : '🔴 **SHORTAGE ALERT** (<75%)'}\n\n`;

      reply += `✍️ **Monthly Digital Signature Status:**\n`;
      if (hasSignedMonthly) {
        reply += `• **Status:** ✅ **SIGNED & VERIFIED** (${monthlySig.month})\n`;
        reply += `• **Signed Date:** ${new Date(monthlySig.signedAt).toLocaleString('en-GB')}\n`;
        reply += `• **Digital Hash:** \`${monthlySig.hash}\`\n\n`;
      } else {
        reply += `• **Status:** ⚠️ **NOT SIGNED / PENDING** (${currentMonthStr})\n`;
        reply += `• **Action Required:** Student must sign monthly attendance sheet via iOS Pen tool.\n\n`;
      }

      reply += `📝 **Leave / On-Duty Status:**\n`;
      reply += `• Pending Requests: ${pendingLeaves} | Approved: ${approvedLeaves}\n`;

      if (student.records.length > 0) {
        reply += `\n🕒 **Recent Class Check-ins:**\n`;
        const recentScans = student.records.slice(0, 4);
        recentScans.forEach((r: any) => {
          const statusIcon = r.status === 'PRESENT' ? '✅' : '❌';
          const timeStr = new Date(r.scanTime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          reply += `  ${statusIcon} **${r.session?.subject?.code || 'CLASS'}** (${r.session?.subject?.name || 'Session'}) — ${timeStr}\n`;
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

      let reply = `**Live Campus Status:** There are ${activeSessions.length} active session(s) right now:\n\n`;
      activeSessions.forEach((s) => {
        const expected = s.batch.students.length;
        const present = s.records.filter((r) => r.status === 'PRESENT').length;
        reply += `- **${s.subject.name}** (${s.batch.name}) by ${s.faculty.name} in ${s.room.name} — (${present}/${expected} Present)\n`;
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
        reply: `**Today's Campus Summary:**\n- Total Sessions: ${todaysSessions.length}\n- Total Check-ins: ${totalPresent} / ${totalStudents}\n- Campus Attendance: **${percentage}%**`,
      });
      return;
    }

    // Default Fallback Guide
    res.json({
      reply: "I am your AI Attendance Assistant. I can look up any student by Roll Number or Name!\n\n💡 **Try asking:**\n- `25MCA110` or `Surender`\n- `25MCA100` or `Akshith`\n- `active` for live sessions\n- `today` for daily summary",
    });
  } catch (error: any) {
    logger.error('Agent chat error', { error: error.message });
    res.status(500).json({ reply: "Sorry, I ran into an internal error while analyzing the data." });
  }
}
