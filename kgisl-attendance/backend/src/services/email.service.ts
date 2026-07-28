import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface SignatureEmailPayload {
  toEmail: string;
  facultyName: string;
  batchName: string;
  month: string;
  totalStudents: number;
  signedCount: number;
  pendingCount: number;
  students: Array<{
    studentName: string;
    rollNo: string;
    email: string;
    attendancePercentage: number;
    totalConducted: number;
    attendedCount: number;
    status: string; // 'SIGNED' | 'PENDING'
    signedAt?: string;
    signatureDataUrl?: string;
    hash?: string;
  }>;
}

export async function sendPasswordResetOtp(email: string, otp: string): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'noreply@kgisl.ac.in';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `KGiSL Portal <${smtpFrom}>`,
        to: email,
        subject: `[KGiSL Attendance] Password Reset OTP Code`,
        html: `<p>Your password reset OTP code is: <strong>${otp}</strong>. Valid for 10 minutes.</p>`,
      });
      return true;
    } catch (err: any) {
      logger.error(`Failed to send reset OTP to ${email}: ${err.message}`);
      return false;
    }
  }
  logger.info(`[EmailService - SIMULATED OTP] Password reset OTP for ${email}: ${otp}`);
  return true;
}

export async function sendFacultySignatureReportEmail(payload: SignatureEmailPayload): Promise<{ success: boolean; message: string; simulated?: boolean }> {
  const { toEmail, facultyName, batchName, month, totalStudents, signedCount, pendingCount, students } = payload;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || 'attendance-audit@kgisl.ac.in';

  // Build HTML Email Document with inline student signatures & roll numbers
  const studentRowsHtml = students.map((s, idx) => {
    const isSigned = s.status === 'SIGNED' && s.signatureDataUrl;
    const statusBadge = isSigned
      ? `<span style="background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px;">SIGNED</span>`
      : `<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 11px;">PENDING</span>`;

    const sigImage = isSigned
      ? `<img src="${s.signatureDataUrl}" alt="Student Signature" style="max-height: 45px; max-width: 140px; border-bottom: 1px solid #ddd;" /><br/><span style="font-size: 9px; color: #666;">Hash: ${s.hash || ''}</span>`
      : `<span style="color: #999; font-style: italic; font-size: 11px;">No signature provided</span>`;

    return `
      <tr style="border-bottom: 1px solid #e5e7eb; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="padding: 10px 12px; font-size: 12px; font-weight: bold; color: #374151;">${s.rollNo}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #111827;">${s.studentName}</td>
        <td style="padding: 10px 12px; font-size: 12px; text-align: center; font-weight: bold; color: ${s.attendancePercentage >= 75 ? '#059669' : '#dc2626'};">
          ${s.attendancePercentage}%
        </td>
        <td style="padding: 10px 12px; text-align: center;">${statusBadge}</td>
        <td style="padding: 10px 12px; text-align: center;">${sigImage}</td>
        <td style="padding: 10px 12px; font-size: 10px; color: #6b7280; text-align: center;">${s.signedAt || '-'}</td>
      </tr>
    `;
  }).join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Monthly Student Attendance Signature Audit - ${month}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #4f46e5; padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: bold;">KGiSL Educational Institutions</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Monthly Student Attendance Signature Audit Document</p>
        </div>

        <!-- Info Bar -->
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb; background-color: #fafafa;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="font-size: 13px; color: #4b5563;"><strong>Faculty / Class Tutor:</strong> ${facultyName}</td>
              <td style="font-size: 13px; color: #4b5563; text-align: right;"><strong>Month:</strong> ${month}</td>
            </tr>
            <tr>
              <td style="font-size: 13px; color: #4b5563; padding-top: 6px;"><strong>Section / Batch:</strong> ${batchName}</td>
              <td style="font-size: 13px; color: #4b5563; text-align: right; padding-top: 6px;"><strong>Status:</strong> ${signedCount} / ${totalStudents} Signed (${pendingCount} Pending)</td>
            </tr>
          </table>
        </div>

        <!-- Student Table -->
        <div style="padding: 20px; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background-color: #1e1b4b; color: #ffffff; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 12px;">Roll No</th>
                <th style="padding: 12px;">Student Name</th>
                <th style="padding: 12px; text-align: center;">Attendance %</th>
                <th style="padding: 12px; text-align: center;">Status</th>
                <th style="padding: 12px; text-align: center;">Handwritten Signature</th>
                <th style="padding: 12px; text-align: center;">Signed Date</th>
              </tr>
            </thead>
            <tbody>
              ${studentRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="padding: 16px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #6b7280;">
          This is an official system-generated attendance audit document. Verified via HMAC-SHA256 & Base64 Signature Logs.<br/>
          KGiSL Smart Attendance System &copy; ${new Date().getFullYear()}
        </div>

      </div>
    </body>
    </html>
  `;

  // If SMTP is configured, send email via nodemailer
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `KGiSL Attendance System <${smtpFrom}>`,
        to: toEmail,
        subject: `[Attendance Audit] Monthly Signature Document - ${batchName} (${month})`,
        html: htmlBody,
      });

      logger.info(`[EmailService] Monthly signature email sent successfully to ${toEmail} for batch ${batchName}`);
      return { success: true, message: `Signature audit document emailed to ${toEmail}` };
    } catch (err: any) {
      logger.error(`[EmailService] Failed to dispatch signature email to ${toEmail}: ${err.message}`);
      return { success: false, message: `Failed to send email: ${err.message}` };
    }
  } else {
    // Simulated dispatch mode (SMTP credentials pending)
    logger.info(`[EmailService - SIMULATED] Monthly signature audit document generated for ${toEmail} (${batchName} - ${month}). SMTP variables not configured.`);
    return {
      success: true,
      simulated: true,
      message: `Signature audit report generated for ${toEmail} (${signedCount}/${totalStudents} signed). SMTP details can be updated anytime in .env.`,
    };
  }
}
