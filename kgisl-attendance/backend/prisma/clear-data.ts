import { prisma } from '../src/config/prisma';

async function clearData() {
  console.log('Clearing transactional data...');

  try {
    // Delete attendance records
    await prisma.attendanceRecord.deleteMany({});
    console.log('Cleared AttendanceRecord');

    // Delete QR history
    await prisma.attendanceQrHistory.deleteMany({});
    console.log('Cleared AttendanceQrHistory');

    // Delete sessions
    await prisma.attendanceSession.deleteMany({});
    console.log('Cleared AttendanceSession');

    // Delete audit logs (which includes login history)
    await prisma.auditLog.deleteMany({});
    console.log('Cleared AuditLog');

    // Delete WhatsApp logs
    await prisma.whatsAppMessageLog.deleteMany({});
    console.log('Cleared WhatsAppMessageLog');

    // Delete leave requests
    await prisma.leaveRequest.deleteMany({});
    console.log('Cleared LeaveRequest');

    // Reset device IDs for all students (for the new device binding feature)
    await prisma.student.updateMany({
      data: {
        deviceId: null,
      },
    });
    console.log('Reset all student device bindings');

    console.log('✅ Successfully cleared all transactional data. The system is fresh!');
  } catch (error) {
    console.error('Failed to clear data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
