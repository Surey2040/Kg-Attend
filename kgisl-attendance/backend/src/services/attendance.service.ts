import { prisma } from '../config/prisma';
import { validateAndRecordScan } from './validation.service';

export async function markAttendance(input: {
  studentId: string;
  qrPayload: any;
  gpsLat: number;
  gpsLng: number;
  gpsAccuracy?: number;
  deviceId: string;
}) {
  const session = await prisma.attendanceSession.findUnique({
    where: { sessionId: input.qrPayload.sessionId },
  });

  return validateAndRecordScan({
    studentId: input.studentId,
    batchId: session?.batchId || '',
    subjectId: session?.subjectId || '',
    deviceId: input.deviceId,
    gps: {
      lat: input.gpsLat,
      lng: input.gpsLng,
      accuracy: input.gpsAccuracy,
    },
    qr: input.qrPayload,
  });
}

export async function markManualAttendance(input: {
  sessionId: string;
  rollNo: string;
  facultyId: string;
}) {
  const { sessionId, rollNo, facultyId } = input;

  const session = await prisma.attendanceSession.findUnique({
    where: { sessionId },
  });

  if (!session || session.status !== 'ACTIVE' || session.facultyId !== facultyId) {
    throw new Error('SESSION_NOT_ACTIVE_OR_INVALID_FACULTY');
  }

  const student = await prisma.student.findUnique({
    where: { rollNo },
  });

  if (!student) throw new Error('STUDENT_NOT_FOUND');
  if (student.batchId !== session.batchId) throw new Error('WRONG_BATCH');

  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      uq_student_session: {
        studentId: student.id,
        sessionId,
      },
    },
  });

  if (existing) throw new Error('ALREADY_MARKED');

  const record = await prisma.attendanceRecord.create({
    data: {
      studentId: student.id,
      sessionId,
      gpsLat: 0,
      gpsLng: 0,
      deviceId: 'MANUAL_ENTRY',
      status: 'PRESENT',
    },
    include: {
      student: true,
      session: {
        include: {
          subject: true,
          batch: true,
          room: true,
        },
      },
    },
  });

  return { record, student };
}

export async function getTodayAttendanceForFaculty(facultyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.attendanceRecord.findMany({
    where: {
      session: { facultyId },
      scanTime: { gte: today },
    },
    include: {
      student: true,
    },
    orderBy: { scanTime: 'desc' },
    take: 50,
  });
}

export async function getAllTodayAttendance() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.attendanceRecord.findMany({
    where: {
      scanTime: { gte: today },
    },
    include: {
      student: true,
    },
    orderBy: { scanTime: 'desc' },
    take: 100,
  });
}
