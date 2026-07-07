import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { Errors } from '../utils/AppError';

/** Coarse IP-level guard against brute-force scan flooding. */
export const scanIpRateLimiter = rateLimit({
  windowMs: env.SCAN_RATE_LIMIT_WINDOW_MS,
  max: env.SCAN_RATE_LIMIT_MAX * 3, // headroom for shared campus NAT/WiFi
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many requests from this network, slow down.' },
});

/**
 * Brute-force protection on login/refresh endpoints. IP-scoped: a single actor
 * hammering credentials from one address gets slowed regardless of which
 * account they're guessing.
 */
export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, try again later.' },
});

/**
 * Fine-grained per-student rate limit using Redis, independent of IP —
 * prevents a single compromised account from hammering the validation
 * pipeline regardless of source IP/NAT.
 */
export async function scanStudentRateLimiter(req: Request, _res: Response, next: NextFunction) {
  const studentId = req.auth?.sub;
  if (!studentId) return next(Errors.INVALID_JWT());

  const key = `attendance:ratelimit:student:${studentId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, env.SCAN_RATE_LIMIT_WINDOW_MS);
  }
  if (count > env.SCAN_RATE_LIMIT_MAX) {
    return next(Errors.RATE_LIMITED());
  }
  next();
}
