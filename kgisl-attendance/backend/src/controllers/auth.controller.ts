import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loginFaculty, loginStudent, loginAdmin } from '../services/auth.service';
import { rotateRefreshToken, revokeRefreshToken } from '../services/refreshToken.service';
import { requestContext } from '../services/audit.service';
import { sendPasswordResetOtp } from '../services/email.service';
import { env } from '../config/env';
import { Errors } from '../utils/AppError';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceId: z.string().optional(),
});

const registerFacultySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
});

import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

export async function registerFacultyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = registerFacultySchema.parse(req.body);
    
    const existing = await prisma.faculty.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, message: 'Faculty with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.faculty.create({
      data: { name, email, passwordHash },
    });

    const result = await loginFaculty(email, password, requestContext(req));
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function facultyLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginFaculty(email, password, requestContext(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function adminLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await loginAdmin(email, password, requestContext(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function studentLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, deviceId } = loginSchema.parse(req.body);
    const result = await loginStudent(email, password, requestContext(req), deviceId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * Exchanges a still-valid refresh token for a new access + refresh token pair.
 * The old refresh token is single-use (rotated) — replaying it after this call
 * revokes the entire device family (see refreshToken.service).
 */
export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    if (!refreshToken) return next(Errors.INVALID_JWT());

    const ctx = requestContext(req);
    const pair = await rotateRefreshToken(refreshToken, ctx);
    res.json({ success: true, data: pair });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    await revokeRefreshToken(refreshToken);
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    // Check if user exists across any role
    const admin = await (prisma as any).admin.findUnique({ where: { email } }).catch(() => null);
    const faculty = await prisma.faculty.findUnique({ where: { email } }).catch(() => null);
    const student = await prisma.student.findUnique({ where: { email } }).catch(() => null);
    
    if (admin || faculty || student) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await bcrypt.hash(otp, 10);
      const ttl = env.PASSWORD_RESET_TTL_SECONDS || 600;
      const expiresAt = new Date(Date.now() + ttl * 1000);
      
      await (prisma as any).passwordReset.upsert({
        where: { email },
        update: { otpHash, expiresAt, createdAt: new Date() },
        create: { email, otpHash, expiresAt },
      });
      
      await sendPasswordResetOtp(email, otp);
    }
    
    // Return same response to prevent enumeration
    res.json({ success: true, message: 'If that email exists in our system, a password reset OTP has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
    
    const record = await (prisma as any).passwordReset.findUnique({ where: { email } });
    if (!record || new Date() > record.expiresAt) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }
    
    const isValid = await bcrypt.compare(otp, record.otpHash);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
      return;
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    const admin = await (prisma as any).admin.findUnique({ where: { email } }).catch(() => null);
    const faculty = await prisma.faculty.findUnique({ where: { email } }).catch(() => null);
    const student = await prisma.student.findUnique({ where: { email } }).catch(() => null);
    
    if (admin) {
      await (prisma as any).admin.update({ where: { email }, data: { passwordHash: newPasswordHash } });
    } else if (faculty) {
      await prisma.faculty.update({ where: { email }, data: { passwordHash: newPasswordHash } });
    } else if (student) {
      await prisma.student.update({ where: { email }, data: { passwordHash: newPasswordHash } });
    }
    
    await (prisma as any).passwordReset.delete({ where: { email } });
    
    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
}

export const resetDevicesHandler = async (req, res, next) => { try { const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); await prisma.student.updateMany({ data: { deviceId: null } }); res.json({ message: 'All student device bindings have been cleared successfully.' }); } catch (error) { next(error); } };
