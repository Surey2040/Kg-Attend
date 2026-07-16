import http from 'http';
import { createApp } from './app';
import { initWebSocket } from './websocket/socket';
import { env } from './config/env';
import { logger } from './utils/logger';
import { resumeActiveSessions } from './services/session.service';
import { sweepExpiredQrHistory } from './services/qr.service';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
// import { initWhatsApp, destroyWhatsApp } from './services/whatsapp.service';

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  initWebSocket(server);

  // Initialize WhatsApp Web client
  // await initWhatsApp();

  await resumeActiveSessions();

  // Housekeeping sweep for the audit table — Redis already governs live validation.
  setInterval(() => {
    sweepExpiredQrHistory().catch((err) => logger.error('[sweeper] failed', { error: err.message }));
  }, 30_000);

  server.listen(env.PORT, () => {
    logger.info(`🚀 KGiSL-IIM Attendance server listening on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close();
    // await destroyWhatsApp();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error', { error: err.message, stack: err.stack });
  process.exit(1);
});
// Trigger reload: WhatsApp locks cleared.

