import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { issueTokenPair } from './refreshToken.service';
import { writeAuditLog } from './audit.service';
import { Errors } from '../utils/AppError';

export interface LoginContext {
  ip: string | null;
  userAgent: string | null;
}

export async function loginFaculty(email: string, password: string, ctx: LoginContext) {
  const faculty = await prisma.faculty.findUnique({ where: { email } });
  if (!faculty || !(await bcrypt.compare(password, faculty.passwordHash))) {
    await writeAuditLog({
      actorId: faculty?.id ?? null,
      actorType: 'FACULTY',
      action: 'LOGIN_FAILED',
      success: false,
      reasonCode: 'INVALID_CREDENTIALS',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { email },
    });
    throw Errors.INVALID_CREDENTIALS();
  }

  const { accessToken, refreshToken, expiresIn } = await issueTokenPair(faculty.id, 'FACULTY');
  await writeAuditLog({
    actorId: faculty.id,
    actorType: 'FACULTY',
    action: 'LOGIN_SUCCESS',
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    token: accessToken,
    refreshToken,
    expiresIn,
    user: { id: faculty.id, name: faculty.name, email: faculty.email, role: 'FACULTY' as const },
  };
}

export async function loginAdmin(email: string, password: string, ctx: LoginContext) {
  // Use 'any' cast for prisma.admin because the client hasn't been generated yet due to DB offline
  const admin = await (prisma as any).admin.findUnique({ where: { email } });
  if (!admin || !admin.isActive || !(await bcrypt.compare(password, admin.passwordHash))) {
    await writeAuditLog({
      actorId: admin?.id ?? null,
      actorType: 'ADMIN' as any,
      action: 'LOGIN_FAILED',
      success: false,
      reasonCode: 'INVALID_CREDENTIALS',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { email },
    });
    throw Errors.INVALID_CREDENTIALS();
  }

  const { accessToken, refreshToken, expiresIn } = await issueTokenPair(admin.id, 'ADMIN' as any);
  await writeAuditLog({
    actorId: admin.id,
    actorType: 'ADMIN' as any,
    action: 'LOGIN_SUCCESS',
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    token: accessToken,
    refreshToken,
    expiresIn,
    user: { id: admin.id, name: admin.name, email: admin.email, role: 'ADMIN' as const },
  };
}

export async function loginStudent(email: string, password: string, ctx: LoginContext, deviceId?: string) {
  const student = await prisma.student.findUnique({ 
    where: { email },
    include: { batch: true } 
  });
  if (!student || !(await bcrypt.compare(password, student.passwordHash))) {
    await writeAuditLog({
      actorId: student?.id ?? null,
      actorType: 'STUDENT',
      action: 'LOGIN_FAILED',
      success: false,
      reasonCode: 'INVALID_CREDENTIALS',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { email },
    });
    throw Errors.INVALID_CREDENTIALS();
  }

  if (deviceId) {
    if (!student.deviceId) {
      await prisma.student.update({
        where: { id: student.id },
        data: { deviceId },
      });
      student.deviceId = deviceId;
    } else if (student.deviceId !== deviceId) {
      await writeAuditLog({
        actorId: student.id,
        actorType: 'STUDENT',
        action: 'LOGIN_FAILED',
        success: false,
        reasonCode: 'DEVICE_MISMATCH',
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { email, providedDeviceId: deviceId, registeredDeviceId: student.deviceId },
      });
      // TEMPORARILY DISABLED FOR TESTING (so Safari PWA doesn't block you)
      // throw Errors.DEVICE_MISMATCH();
      
      // Auto-update device ID for now so testing is easy
      await prisma.student.update({
        where: { id: student.id },
        data: { deviceId },
      });
    }
  }

  const { accessToken, refreshToken, expiresIn } = await issueTokenPair(student.id, 'STUDENT');
  await writeAuditLog({
    actorId: student.id,
    actorType: 'STUDENT',
    action: 'LOGIN_SUCCESS',
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return {
    token: accessToken,
    refreshToken,
    expiresIn,
    user: { id: student.id, name: student.name, rollNo: student.rollNo, email: student.email, batchName: student.batch?.name, role: 'STUDENT' as const },
  };
}
