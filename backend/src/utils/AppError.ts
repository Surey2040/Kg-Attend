export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  INVALID_JWT: () => new AppError('INVALID_JWT', 'Authentication token is invalid or expired', 401),
  STUDENT_NOT_FOUND: () => new AppError('STUDENT_NOT_FOUND', 'Student does not exist', 404),
  SESSION_NOT_ACTIVE: () => new AppError('SESSION_NOT_ACTIVE', 'Attendance session is not active', 409),
  SESSION_NOT_FOUND: () => new AppError('SESSION_NOT_FOUND', 'Attendance session not found', 404),
  INVALID_SIGNATURE: () => new AppError('INVALID_SIGNATURE', 'QR signature verification failed', 401),
  QR_EXPIRED: () => new AppError('QR_EXPIRED', 'QR code has expired', 410),
  TOKEN_REVOKED: () => new AppError('TOKEN_REVOKED', 'QR token has been revoked', 410),
  TOKEN_ALREADY_USED: () => new AppError('TOKEN_ALREADY_USED', 'This QR code has already been used', 409),
  BATCH_MISMATCH: () => new AppError('BATCH_MISMATCH', 'Student does not belong to this batch', 403),
  SUBJECT_MISMATCH: () => new AppError('SUBJECT_MISMATCH', 'Subject does not match active session', 403),
  OUTSIDE_TIME_WINDOW: () => new AppError('OUTSIDE_TIME_WINDOW', 'Scan is outside the allowed attendance time window', 403),
  GPS_REQUIRED: () => new AppError('GPS_REQUIRED', 'GPS coordinates are required', 400),
  OUTSIDE_GEOFENCE: () => new AppError('OUTSIDE_GEOFENCE', 'Student is outside the campus geofence', 403),
  DUPLICATE_ATTENDANCE: () => new AppError('DUPLICATE_ATTENDANCE', 'Attendance already marked for this session', 409),
  RATE_LIMITED: () => new AppError('RATE_LIMITED', 'Too many scan attempts, please slow down', 429),
  INVALID_CREDENTIALS: () => new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401),
};
