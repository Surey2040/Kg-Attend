import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export async function handleAgentChat(req: Request, res: Response): Promise<void> {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ reply: "Please provide a valid message." });
      return;
    }

    const lowerMessage = message.toLowerCase();

    // 1. Detect Roll Number (e.g., 733921104051, 21MCA01, etc. Usually alphanumeric or numeric)
    const rollNoRegex = /\b([a-zA-Z0-9]{5,15})\b/g;
    const words = message.split(/\s+/);
    
    // Look for a student by checking words that might be roll numbers
    for (const word of words) {
      if (word.length > 4) { // typical roll numbers are > 4 chars
        const student = await prisma.student.findFirst({
          where: { 
            OR: [
              { rollNo: { contains: word, mode: 'insensitive' } },
              { name: { contains: word, mode: 'insensitive' } }
            ]
          },
          include: {
            records: { include: { session: { include: { subject: true } } } },
            leaveRequests: true,
            batch: true
          }
        });

        if (student) {
          const totalSessions = student.records.length;
          const presentSessions = student.records.filter(r => r.status === 'PRESENT').length;
          const percentage = totalSessions > 0 ? ((presentSessions / totalSessions) * 100).toFixed(1) : 0;
          const pendingLeaves = student.leaveRequests.filter(l => l.status === 'PENDING').length;

          let reply = `**Student Analysis Found:**\n`;
          reply += `- **Name:** ${student.name}\n`;
          reply += `- **Roll No:** ${student.rollNo}\n`;
          reply += `- **Batch:** ${student.batch.name}\n`;
          reply += `- **Overall Attendance:** ${percentage}% (${presentSessions}/${totalSessions} sessions)\n`;
          
          if (pendingLeaves > 0) {
            reply += `- ⚠️ Has ${pendingLeaves} pending leave request(s).\n`;
          }

          if (totalSessions > 0) {
            reply += `\n*Recent Classes:* \n`;
            const recent = student.records.sort((a,b) => b.scanTime.getTime() - a.scanTime.getTime()).slice(0, 3);
            recent.forEach(r => {
              reply += `  • ${r.session.subject.name} - ${r.status} (${r.scanTime.toLocaleDateString()})\n`;
            });
          }

          res.json({ reply });
          return;
        }
      }
    }

    // 2. Active Sessions
    if (lowerMessage.includes('active') || lowerMessage.includes('live')) {
      const activeSessions = await prisma.attendanceSession.findMany({
        where: { status: 'ACTIVE' },
        include: { subject: true, batch: { include: { students: true } }, room: true, faculty: true, records: true }
      });
      
      if (activeSessions.length === 0) {
        res.json({ reply: "There are currently no active sessions running on campus." });
        return;
      }

      let reply = `**Live Campus Status:** There are ${activeSessions.length} active sessions right now:\n\n`;
      activeSessions.forEach(s => {
        const expected = s.batch.students.length;
        const present = s.records.filter(r => r.status === 'PRESENT').length;
        reply += `- **${s.subject.name}** (${s.batch.name}) by ${s.faculty.name} in ${s.room.name}. (${present}/${expected} Present)\n`;
      });
      res.json({ reply });
      return;
    }

    // 3. Today's Attendance Summary
    if (lowerMessage.includes('today') || lowerMessage.includes('summary')) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const todaysSessions = await prisma.attendanceSession.findMany({
        where: { startedAt: { gte: startOfDay } },
        include: { records: true, batch: { include: { students: true } } }
      });

      if (todaysSessions.length === 0) {
        res.json({ reply: "No attendance sessions have been conducted today." });
        return;
      }

      let totalStudents = 0;
      let totalPresent = 0;

      todaysSessions.forEach(session => {
        totalStudents += session.batch.students.length;
        const presentCount = session.records.filter(r => r.status === 'PRESENT').length;
        totalPresent += presentCount;
      });

      const percentage = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : 0;

      res.json({ reply: `**Today's Campus Summary:**\n- Sessions Conducted: ${todaysSessions.length}\n- Total Check-ins: ${totalPresent} / ${totalStudents} expected\n- Overall Campus Attendance: **${percentage}%**` });
      return;
    }

    // Default Fallback
    res.json({ reply: "I am your System Agent. I am constantly monitoring the database. You can:\n- Type a **Student's Roll Number or Name** to get their full analysis.\n- Ask about **'active'** or **'live'** sessions.\n- Ask for **'today's summary'**." });
    return;

  } catch (error: any) {
    logger.error('Agent chat error', { error: error.message });
    res.status(500).json({ reply: "Sorry, I ran into an internal error while analyzing the data." });
  }
}
