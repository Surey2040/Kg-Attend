import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const createLeaveSchema = z.object({
  type: z.enum(['LEAVE', 'ON_DUTY']),
  fromDate: z.string().transform((val) => new Date(val)),
  toDate: z.string().transform((val) => new Date(val)),
  reason: z.string().min(10),
});

const reviewLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().optional(),
});

export async function submitLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createLeaveSchema.parse(req.body);
    const studentId = req.auth!.sub;

    const request = await prisma.leaveRequest.create({
      data: {
        ...data,
        studentId,
        status: 'PENDING',
      },
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function getMyLeaveRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const studentId = req.auth!.sub;
    const requests = await prisma.leaveRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

export async function getPendingLeaveRequests(req: Request, res: Response, next: NextFunction) {
  try {
    // Faculty / Admin
    const requests = await prisma.leaveRequest.findMany({
      where: { status: 'PENDING' },
      include: { student: { select: { name: true, rollNo: true, batch: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

export async function reviewLeaveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = reviewLeaveSchema.parse(req.body);
    const reviewerId = req.auth!.sub;

    const request = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: data.status,
        reviewNote: data.reviewNote,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}
