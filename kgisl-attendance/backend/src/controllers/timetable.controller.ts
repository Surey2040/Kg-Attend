import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const importTimetableSchema = z.array(
  z.object({
    facultyEmail: z.string().email(),
    subjectCode: z.string(),
    batchName: z.string(),
    roomName: z.string(),
    dayOfWeek: z.number().int().min(1).max(7),
    startTime: z.string(), // "09:00"
    endTime: z.string(),   // "10:00"
  })
);

export async function importTimetable(req: Request, res: Response, next: NextFunction) {
  try {
    const data = importTimetableSchema.parse(req.body);

    // Fetch master data to map names/codes to IDs
    const faculties = await prisma.faculty.findMany();
    const subjects = await prisma.subject.findMany();
    const batches = await prisma.batch.findMany();
    const rooms = await prisma.room.findMany();

    const facultyMap = new Map(faculties.map((f) => [f.email, f.id]));
    const subjectMap = new Map(subjects.map((s) => [s.code, s.id]));
    const batchMap = new Map(batches.map((b) => [b.name, b.id]));
    const roomMap = new Map(rooms.map((r) => [r.name, r.id]));

    const allocationsToCreate = [];

    for (const row of data) {
      const facultyId = facultyMap.get(row.facultyEmail);
      const subjectId = subjectMap.get(row.subjectCode);
      const batchId = batchMap.get(row.batchName);
      const roomId = roomMap.get(row.roomName);

      if (!facultyId || !subjectId || !batchId || !roomId) {
        return res.status(400).json({
          success: false,
          message: `Mapping failed for row: ${JSON.stringify(row)}. Make sure Master Data exists.`,
        });
      }

      allocationsToCreate.push({
        facultyId,
        subjectId,
        batchId,
        roomId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
      });
    }

    // Wrap in a transaction
    await prisma.$transaction(async (tx) => {
      // Optional: Clear existing timetable or append? Product rule usually clears all or appends.
      // We will just append to allow additive changes.
      await tx.timetableAllocation.createMany({
        data: allocationsToCreate,
      });
    });

    res.json({ success: true, message: `Imported ${allocationsToCreate.length} timetable allocations.` });
  } catch (err) {
    next(err);
  }
}

export async function listTimetableAllocations(req: Request, res: Response, next: NextFunction) {
  try {
    const { facultyId } = req.query;

    const query = facultyId ? { facultyId: String(facultyId) } : {};
    
    const allocations = await prisma.timetableAllocation.findMany({
      where: query,
      include: {
        faculty: { select: { name: true, email: true } },
        subject: { select: { name: true, code: true } },
        batch: { select: { name: true } },
        room: { select: { name: true } },
      },
    });

    res.json({ success: true, data: allocations });
  } catch (err) {
    next(err);
  }
}
