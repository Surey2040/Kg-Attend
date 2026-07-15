import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Simulating QR scans for all students...');

  const batchNames = ['II MCA A', 'II MCA B', 'II MCA C'];
  
  // Need a faculty, subject, and room to create dummy sessions
  const faculty = await prisma.faculty.findFirst();
  const subject = await prisma.subject.findFirst();
  const room = await prisma.room.findFirst();

  if (!faculty || !subject || !room) {
    console.error('Missing faculty, subject, or room data. Cannot create sessions.');
    return;
  }

  let totalSuccess = 0;

  for (const bName of batchNames) {
    const batch = await prisma.batch.findUnique({ where: { name: bName } });
    if (!batch) continue;

    // Check for active session
    let activeSession = await prisma.attendanceSession.findFirst({
      where: { batchId: batch.id, status: 'ACTIVE' }
    });

    if (!activeSession) {
      console.log(`No active session for ${bName}. Creating one...`);
      activeSession = await prisma.attendanceSession.create({
        data: {
          facultyId: faculty.id,
          subjectId: subject.id,
          roomId: room.id,
          batchId: batch.id,
          status: 'ACTIVE'
        }
      });
    }

    const students = await prisma.student.findMany({ where: { batchId: batch.id } });
    console.log(`Found ${students.length} students in ${bName}. Marking PRESENT...`);

    for (const student of students) {
      try {
        await prisma.attendanceRecord.upsert({
          where: {
            uq_student_session: {
              studentId: student.id,
              sessionId: activeSession.sessionId,
            }
          },
          update: { status: 'PRESENT', scanTime: new Date() },
          create: {
            studentId: student.id,
            sessionId: activeSession.sessionId,
            gpsLat: 11.081679,
            gpsLng: 77.005543,
            locationVerified: true,
            status: 'PRESENT',
            deviceId: 'simulated-device-' + student.rollNo,
          }
        });
        totalSuccess++;
      } catch (err) {
        console.error(`Failed for ${student.rollNo}:`, err);
      }
    }
  }

  console.log(`✅ Successfully marked ${totalSuccess} students as PRESENT across all batches.`);
  console.log('You can now refresh your Faculty Dashboard to see the updated stats!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
