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
  INVALID_QR_SIGNATURE: () => new AppError('INVALID_QR_SIGNATURE', 'The QR code is invalid or has been modified.', 401),
  QR_EXPIRED: () => new AppError('QR_EXPIRED', 'This QR code has expired. Scan the latest QR code.', 410),
  TOKEN_REVOKED: () => new AppError('TOKEN_REVOKED', 'QR token has been revoked', 410),
  TOKEN_ALREADY_USED: () => new AppError('TOKEN_ALREADY_USED', 'This QR code has already been used', 409),
  BATCH_MISMATCH: () => new AppError('BATCH_MISMATCH', 'Student does not belong to this batch', 403),
  SUBJECT_MISMATCH: () => new AppError('SUBJECT_MISMATCH', 'Subject does not match active session', 403),
  OUTSIDE_TIME_WINDOW: () => new AppError('OUTSIDE_TIME_WINDOW', 'Scan is outside the allowed attendance time window', 403),
  GPS_REQUIRED: () => new AppError('GPS_REQUIRED', 'GPS coordinates are required', 400),
  POOR_GPS_ACCURACY: () => new AppError('POOR_GPS_ACCURACY', 'Location accuracy is too low. Please move to an open area and try again.', 400),
  OUTSIDE_ALLOWED_LOCATION: () => new AppError('OUTSIDE_ALLOWED_LOCATION', 'You are outside the allowed attendance location.', 403),
  ATTENDANCE_ALREADY_MARKED: () => new AppError('ATTENDANCE_ALREADY_MARKED', 'Attendance has already been marked for this session.', 409),
  DEVICE_NOT_AUTHORIZED: () => new AppError('DEVICE_NOT_AUTHORIZED', 'Attendance cannot be marked from this device.', 403),
  RATE_LIMITED: () => new AppError('RATE_LIMITED', 'Too many scan attempts, please slow down', 429),
  INVALID_CREDENTIALS: () => new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401),
  DEVICE_MISMATCH: () => new AppError('DEVICE_MISMATCH', 'Login failed: Device mismatch. You can only log in from your registered phone.', 403),
  NOT_FOUND: (msg = 'Resource not found') => new AppError('NOT_FOUND', msg, 404),
};
