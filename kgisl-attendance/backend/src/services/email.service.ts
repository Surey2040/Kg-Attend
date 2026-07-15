import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.BREVO_API_KEY;
  const pass = process.env.SMTP_PASS || process.env.BREVO_API_KEY;

  if (!user || !pass) {
    logger.warn('[email] SMTP credentials missing, emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  return transporter;
}

export async function sendPasswordResetOtp(email: string, otp: string) {
  const mailer = getTransporter();
  if (!mailer) {
    logger.info(`[email] Simulated sending OTP ${otp} to ${email}`);
    return;
  }

  const fromAddress = process.env.EMAIL_FROM || 'noreply@kgisliim.ac.in';
  
  // Use a default TTL of 600 seconds (10 minutes) if not in env
  const ttlMinutes = (env.PASSWORD_RESET_TTL_SECONDS || 600) / 60;

  try {
    const info = await mailer.sendMail({
      from: `"KGiSL Attendance" <${fromAddress}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      text: `Your password reset OTP is ${otp}. It expires in ${ttlMinutes} minutes.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #333;">Password Reset</h2>
          <p>You requested a password reset. Here is your One-Time Password (OTP):</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">This OTP will expire in ${ttlMinutes} minutes.</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });
    logger.info(`[email] OTP sent to ${email}, messageId: ${info.messageId}`);
  } catch (err: any) {
    logger.error(`[email] Failed to send OTP to ${email}`, { error: err.message });
  }
}
