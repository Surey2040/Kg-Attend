import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini if key is provided
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

export async function handleAgentChat(req: Request, res: Response): Promise<void> {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ reply: "Please provide a valid message." });
      return;
    }

    if (!ai) {
      res.json({ reply: "I am the AI Agent, but my true brain (Gemini API) is not connected yet. Please ask the Admin to add the `GEMINI_API_KEY` to the environment variables so I can access live campus data and answer your questions intelligently." });
      return;
    }

    // 1. Gather Live Campus Data for Context
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activeSessions, todaysSessions, pendingLeaves] = await Promise.all([
      prisma.attendanceSession.findMany({
        where: { status: 'ACTIVE' },
        include: { subject: true, room: true, faculty: true, batch: { include: { students: true } }, records: true }
      }),
      prisma.attendanceSession.findMany({
        where: { startedAt: { gte: startOfDay } },
        include: { records: true, batch: { include: { students: true } } }
      }),
      prisma.leaveRequest.findMany({
        where: { status: 'PENDING' },
        include: { student: true }
      })
    ]);

    // Format Active Sessions
    let activeSessionsText = "No active sessions.";
    if (activeSessions.length > 0) {
      activeSessionsText = activeSessions.map(s => {
        const expected = s.batch.students.length;
        const present = s.records.filter(r => r.status === 'PRESENT').length;
        return `- ${s.subject.name} by ${s.faculty.name} in ${s.room.name}. (${present}/${expected} present)`;
      }).join("\n");
    }

    // Format Today's Overall Stats
    let totalExpected = 0;
    let totalPresent = 0;
    todaysSessions.forEach(session => {
      totalExpected += session.batch.students.length;
      totalPresent += session.records.filter(r => r.status === 'PRESENT').length;
    });

    const systemPrompt = `
You are "Genius", the highly intelligent AI Assistant for KGiSL-IIM's Enterprise Attendance System.
Your job is to answer the user's questions strictly using the live real-time campus data provided below.
Be concise, professional, but friendly. Do not hallucinate data that isn't here. If you don't know, say you don't know based on current data.

### LIVE CAMPUS CONTEXT (As of ${new Date().toLocaleString()}):

**ACTIVE SESSIONS RIGHT NOW:**
${activeSessionsText}

**TODAY'S OVERALL STATS:**
- Total Sessions Conducted: ${todaysSessions.length}
- Total Expected Check-ins: ${totalExpected}
- Total Present Check-ins: ${totalPresent}
- Overall Attendance: ${totalExpected > 0 ? ((totalPresent / totalExpected) * 100).toFixed(1) : 0}%

**PENDING LEAVE REQUESTS:**
- Total Pending: ${pendingLeaves.length} requests waiting for approval.

### USER QUERY:
${message}
    `;

    // 2. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: systemPrompt,
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    logger.error('Agent chat error', { error: error.message });
    res.status(500).json({ reply: "Sorry, I ran into an internal server error while thinking. Ensure the API key is valid." });
  }
}
