import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

const ACADEMIC_YEAR_REDIS_KEY = 'presenceiq:system:academic_year_config';

export interface AcademicYearConfig {
  academicYear: string; // e.g. "2026-2027 ODD Semester"
  totalWorkingDays: number; // e.g. 90
  startDate: string; // "2026-06-04"
  endDate: string; // "2026-11-30"
  notes?: string;
  updatedAt?: string;
}

const DEFAULT_CONFIG: AcademicYearConfig = {
  academicYear: '2026-2027 ODD Semester',
  totalWorkingDays: 90,
  startDate: '2026-06-04',
  endDate: '2026-11-30',
  notes: 'Configured by Admin for KGiSL-IIM Odd Semester',
  updatedAt: new Date().toISOString(),
};

export async function getAcademicYearConfig(): Promise<AcademicYearConfig> {
  try {
    const raw = await redis.get(ACADEMIC_YEAR_REDIS_KEY);
    if (raw) {
      return JSON.parse(raw) as AcademicYearConfig;
    }
  } catch (err) {
    console.error('Error reading academic year config from Redis:', err);
  }
  return DEFAULT_CONFIG;
}

export async function getAcademicYearConfigHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await getAcademicYearConfig();
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
}

export async function updateAcademicYearConfigHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { academicYear, totalWorkingDays, startDate, endDate, notes } = req.body;

    const workingDays = Math.max(1, parseInt(totalWorkingDays, 10) || 90);

    const newConfig: AcademicYearConfig = {
      academicYear: academicYear || '2026-2027 ODD Semester',
      totalWorkingDays: workingDays,
      startDate: startDate || '2026-06-04',
      endDate: endDate || '2026-11-30',
      notes: notes || '',
      updatedAt: new Date().toISOString(),
    };

    await redis.set(ACADEMIC_YEAR_REDIS_KEY, JSON.stringify(newConfig));

    res.json({
      success: true,
      message: `Academic Year updated to ${newConfig.academicYear} with ${newConfig.totalWorkingDays} Working Days.`,
      data: newConfig,
    });
  } catch (err) {
    next(err);
  }
}
