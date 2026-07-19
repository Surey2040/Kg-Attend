import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

const createFacultySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const createStudentSchema = z.object({
  name: z.string().min(1),
  rollNo: z.string().min(1),
  batchId: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(6),
});

const createBatchSchema = z.object({
  name: z.string().min(1),
});

const createSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

const createRoomSchema = z.object({
  name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  geofenceRadiusM: z.number().int().positive().default(120),
});

// Admin Controllers
export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const students = await prisma.student.count();
    const faculty = await prisma.faculty.count();
    const sessions = await (prisma as any).attendanceSession.count();
    res.json({ success: true, data: { students, faculty, sessions } });
  } catch (err) {
    next(err);
  }
}

// Faculty Management
export async function listFaculty(_req: Request, res: Response, next: NextFunction) {
  try {
    const faculty = await prisma.faculty.findMany({ select: { id: true, name: true, email: true, createdAt: true } });
    res.json({ success: true, data: faculty });
  } catch (err) {
    next(err);
  }
}

export async function createFaculty(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createFacultySchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const faculty = await prisma.faculty.create({
      data: { name: data.name, email: data.email, passwordHash },
      select: { id: true, name: true, email: true }
    });
    res.status(201).json({ success: true, data: faculty });
  } catch (err) {
    next(err);
  }
}

// Student Management
export async function listStudents(_req: Request, res: Response, next: NextFunction) {
  try {
    const students = await prisma.student.findMany({
      select: { id: true, name: true, rollNo: true, email: true, batchId: true, deviceId: true, phone: true }
    });
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
}

export async function createStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createStudentSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);
    const student = await prisma.student.create({
      data: { ...data, passwordHash },
      select: { id: true, name: true, rollNo: true, email: true }
    });
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

// Batch Management
export async function createBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createBatchSchema.parse(req.body);
    const batch = await prisma.batch.create({ data });
    res.status(201).json({ success: true, data: batch });
  } catch (err) {
    next(err);
  }
}

// Subject Management
export async function createSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSubjectSchema.parse(req.body);
    const subject = await prisma.subject.create({ data });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
}

// Room Management
export async function createRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createRoomSchema.parse(req.body);
    const room = await prisma.room.create({ data });
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
}

export async function getAuditLogs(_req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Resolve actorIds to human-readable labels in bulk to avoid N+1 queries
    const studentIds = [...new Set(logs.filter(l => l.actorType === 'STUDENT' && l.actorId).map(l => l.actorId!))];
    const facultyIds = [...new Set(logs.filter(l => l.actorType === 'FACULTY' && l.actorId).map(l => l.actorId!))];

    const [students, faculties] = await Promise.all([
      studentIds.length > 0
        ? prisma.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, rollNo: true } })
        : [],
      facultyIds.length > 0
        ? prisma.faculty.findMany({ where: { id: { in: facultyIds } }, select: { id: true, name: true, email: true } })
        : [],
    ]);

    const studentMap = new Map(students.map(s => [s.id, s]));
    const facultyMap = new Map(faculties.map(f => [f.id, f]));

    const enrichedLogs = logs.map(log => {
      let actorLabel: string = log.actorId ?? 'System';
      let actorName: string | null = null;

      if (log.actorType === 'STUDENT' && log.actorId) {
        const s = studentMap.get(log.actorId);
        if (s) {
          actorLabel = s.rollNo;
          actorName = s.name;
        }
      } else if (log.actorType === 'FACULTY' && log.actorId) {
        const f = facultyMap.get(log.actorId);
        if (f) {
          actorLabel = f.email;
          actorName = f.name;
        }
      } else if (log.actorType === 'ADMIN') {
        actorLabel = 'Admin';
      } else if (log.actorType === 'SYSTEM') {
        actorLabel = 'System';
      }

      return {
        ...log,
        actorLabel,   // human-readable: rollNo for students, email for faculty
        actorName,    // full name for tooltip/display
      };
    });

    res.json({ success: true, data: enrichedLogs });
  } catch (err) {
    next(err);
  }
}

