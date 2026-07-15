import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import sessionRoutes from './routes/session.routes';
import scanRoutes from './routes/scan.routes';
import authRoutes from './routes/auth.routes';
import catalogRoutes from './routes/catalog.routes';
import facultyRoutes from './routes/faculty.routes';
import studentRoutes from './routes/student.routes';
import historyRoutes from './routes/history.routes';
import attendanceRoutes from './routes/attendance.routes';
import adminRoutes from './routes/admin.routes';
import timetableRoutes from './routes/timetable.routes';
import leaveRoutes from './routes/leave.routes';
import reportRoutes from './routes/report.routes';
import agentRoutes from './routes/agent.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { allowedOrigins } from './config/env';

export function createApp() {
  const app = express();

  // Needed so req.ip reflects the real client (not the load balancer/reverse proxy),
  // which audit logs and IP-based rate limiting both depend on.
  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'], // QR codes are served as base64 data: URLs
          connectSrc: ["'self'", ...allowedOrigins],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
    })
  );
  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        origin.endsWith('.loca.lt') ||
        origin.endsWith('.localtunnel.me') ||
        origin.endsWith('.onrender.com');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false); // Reject gracefully
      }
    },
    credentials: true,
  };
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '32kb' })); // QR/scan payloads are tiny — cap body size

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/timetable', timetableRoutes);
  app.use('/api/v1/catalog', catalogRoutes);
  app.use('/api/v1/sessions', sessionRoutes);
  app.use('/api/v1/leave', leaveRoutes);
  app.use('/api/v1/scan', scanRoutes);
  app.use('/api/v1/faculty', facultyRoutes);
  app.use('/api/v1/students', studentRoutes);
  app.use('/api/v1/history', historyRoutes);
  app.use('/api/v1/agent', agentRoutes);
  app.use('/api/v1/report', reportRoutes);
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use('/api/v1/whatsapp', whatsappRoutes);

  app.use(errorHandler);

  return app;
}
