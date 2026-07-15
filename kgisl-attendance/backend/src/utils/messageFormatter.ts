/**
 * messageFormatter.ts
 *
 * Pure formatting functions for WhatsApp attendance notification messages.
 * Kept isolated so the message template can be updated without touching
 * any service or controller code.
 */

export interface AttendanceMessageData {
  studentName: string;
  registerNo: string;
  status: string;
  date: string;
  time: string;
  location: string;
  subjectName?: string;
  batchName?: string;
}

/**
 * Formats a student attendance notification for WhatsApp.
 * Uses WhatsApp-supported bold (*text*) formatting.
 */
export function formatAttendanceMessage(data: AttendanceMessageData): string {
  const statusEmoji = data.status === 'PRESENT' ? '✅' : '❌';

  return [
    `📋 *KGiSL Attendance Notification*`,
    ``,
    `👤 Student Name: ${data.studentName}`,
    `🆔 Register No: ${data.registerNo}`,
    ...(data.subjectName ? [`📚 Subject: ${data.subjectName}`] : []),
    ...(data.batchName ? [`🏫 Batch: ${data.batchName}`] : []),
    ``,
    `${statusEmoji} Attendance Status: *${data.status}*`,
    ``,
    `📅 Date: ${data.date}`,
    `⏰ Time: ${data.time}`,
    ``,
    `📍 Location:`,
    `${data.location}`,
    ``,
    `Thank you.`,
  ].join('\n');
}

/**
 * Formats a parent notification — same content with a parent-specific header.
 */
export function formatParentNotification(data: AttendanceMessageData): string {
  const statusEmoji = data.status === 'PRESENT' ? '✅' : '❌';

  return [
    `📋 *KGiSL Parent Notification*`,
    ``,
    `Dear Parent,`,
    ``,
    `Your ward's attendance has been recorded:`,
    ``,
    `👤 Student Name: ${data.studentName}`,
    `🆔 Register No: ${data.registerNo}`,
    ...(data.subjectName ? [`📚 Subject: ${data.subjectName}`] : []),
    ``,
    `${statusEmoji} Attendance Status: *${data.status}*`,
    ``,
    `📅 Date: ${data.date}`,
    `⏰ Time: ${data.time}`,
    ``,
    `📍 Location:`,
    `${data.location}`,
    ``,
    `Thank you.`,
    `_KGiSL Institute of Information Management_`,
  ].join('\n');
}
