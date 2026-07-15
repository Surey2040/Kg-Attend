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
export async function getStats(req: Request, res: Response, next: NextFunction) {
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
export async function listFaculty(req: Request, res: Response, next: NextFunction) {
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
export async function listStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const students = await prisma.student.findMany({
      include: { batch: true },
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
