import { AttendanceStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { redis, statsRedisKey } from '../config/redis';
import { logger } from '../utils/logger';

export interface QueuedScanRecord {
  studentId: string;
  sessionId: string;
  gpsLat: number;
  gpsLng: number;
  gpsAccuracy?: number;
  distanceFromCampus?: number;
  detectedRoom?: string | null;
  deviceId: string;
  status: AttendanceStatus;
  isSuspicious?: boolean;
  flagReason?: string | null;
  scanTime: Date;
}

class BatchQueueService {
  private queue: QueuedScanRecord[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BATCH_FLUSH_MS = 2000;
  private readonly MAX_BATCH_SIZE = 25;

  constructor() {
    this.startAutoFlush();
  }

  private startAutoFlush() {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flushInterval = setInterval(() => {
      this.flush().catch((err) => {
        logger.error('[batch-queue] auto flush failed', { error: err.message });
      });
    }, this.BATCH_FLUSH_MS);
  }

  /**
   * Pushes a verified attendance scan into the queue.
   * If the queue reaches MAX_BATCH_SIZE, flushes immediately.
   */
  public async push(scan: QueuedScanRecord) {
    this.queue.push(scan);

    // Increment live present count in Redis immediately for 0-latency statistics
    if (scan.status === 'PRESENT') {
      try {
        await redis.hincrby(statsRedisKey(scan.sessionId), 'present', 1);
      } catch (err: any) {
        logger.warn('[batch-queue] failed to update redis stats count', { error: err.message });
      }
    }

    if (this.queue.length >= this.MAX_BATCH_SIZE) {
      await this.flush();
    }
  }

  /**
   * Bulk-flushes queued attendance records to PostgreSQL database using createMany.
   */
  public async flush() {
    if (this.queue.length === 0) return;

    const toProcess = [...this.queue];
    this.queue = [];

    try {
      await prisma.attendanceRecord.createMany({
        data: toProcess.map((item) => ({
          studentId: item.studentId,
          sessionId: item.sessionId,
          gpsLat: item.gpsLat,
          gpsLng: item.gpsLng,
          gpsAccuracy: item.gpsAccuracy,
          distanceFromCampus: item.distanceFromCampus,
          detectedRoom: item.detectedRoom,
          locationVerified: item.status === 'PRESENT',
          locationVerificationStatus: item.status === 'PRESENT' ? 'VERIFIED' : 'FAILED',
          locationVerifiedAt: item.status === 'PRESENT' ? item.scanTime : null,
          deviceId: item.deviceId,
          status: item.status,
          isSuspicious: item.isSuspicious ?? false,
          flagReason: item.flagReason ?? null,
          scanTime: item.scanTime,
        })),
        skipDuplicates: true, // Prevents primary key / unique constraint race conditions
      });

      logger.info('[batch-queue] flushed attendance records batch', { count: toProcess.length });
    } catch (err: any) {
      logger.error('[batch-queue] bulk insert failed, re-queueing records', { error: err.message, count: toProcess.length });
      // Re-queue items if bulk write failed
      this.queue.unshift(...toProcess);
    }
  }

  /**
   * Helper to fetch or initialize Redis-cached session statistics.
   */
  public async getCachedStats(sessionId: string): Promise<{ totalStudents: number; present: number; absent: number; progressPercent: number } | null> {
    try {
      const stats = await redis.hgetall(statsRedisKey(sessionId));
      if (stats && stats.totalStudents) {
        const total = parseInt(stats.totalStudents, 10) || 0;
        const present = parseInt(stats.present, 10) || 0;
        const absent = Math.max(0, total - present);
        const progressPercent = total === 0 ? 0 : Math.round((present / total) * 10000) / 100;
        return { totalStudents: total, present, absent, progressPercent };
      }
    } catch (err: any) {
      logger.warn('[batch-queue] redis hgetall failed', { error: err.message });
    }
    return null;
  }

  /**
   * Initializes session statistics in Redis.
   */
  public async setCachedStats(sessionId: string, totalStudents: number, present: number) {
    try {
      await redis.hset(statsRedisKey(sessionId), {
        totalStudents: totalStudents.toString(),
        present: present.toString(),
      });
      await redis.expire(statsRedisKey(sessionId), 7200); // 2-hour TTL
    } catch (err: any) {
      logger.warn('[batch-queue] redis hset failed', { error: err.message });
    }
  }
}

export const batchQueueService = new BatchQueueService();
