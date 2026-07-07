import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const batch = await prisma.batch.upsert({
    where: { name: 'MCA - II Year A' },
    update: {},
    create: { name: 'MCA - II Year A' },
  });

  await prisma.batch.upsert({
    where: { name: 'MCA - II Year B' },
    update: {},
    create: { name: 'MCA - II Year B' },
  });

  await prisma.batch.upsert({
    where: { name: 'MCA - I Year A' },
    update: {},
    create: { name: 'MCA - I Year A' },
  });

  const subjects = ['Java Programming', 'Data Structures', 'Operating Systems', 'DBMS'];
  for (const name of subjects) {
    await prisma.subject.upsert({
      where: { code: name.replace(/\s+/g, '_').toUpperCase() },
      update: {},
      create: { name, code: name.replace(/\s+/g, '_').toUpperCase() },
    });
  }

  // NOTE: replace latitude/longitude with your actual campus coordinates —
  // these are placeholders and the geofence check will reject every scan
  // until they're set correctly.
  await prisma.room.upsert({
    where: { name: '302 - MCA Lab' },
    update: {},
    create: {
      name: '302 - MCA Lab',
      latitude: 13.0827,
      longitude: 80.2707,
      geofenceRadiusM: 120,
      wifiBssidWhitelist: [],
    },
  });
  await prisma.room.upsert({
    where: { name: '210 - Seminar Hall' },
    update: {},
    create: { name: '210 - Seminar Hall', latitude: 13.0827, longitude: 80.2707, geofenceRadiusM: 150, wifiBssidWhitelist: [] },
  });
  await prisma.room.upsert({
    where: { name: '105 - Lecture Hall' },
    update: {},
    create: { name: '105 - Lecture Hall', latitude: 13.0827, longitude: 80.2707, geofenceRadiusM: 150, wifiBssidWhitelist: [] },
  });

  const faculty = await prisma.faculty.upsert({
    where: { email: 'ravi.kumar@kgisl-iim.ac.in' },
    update: {},
    create: { name: 'Ravi Kumar', email: 'ravi.kumar@kgisl-iim.ac.in', passwordHash },
  });

  const sasidharanPasswordHash = await bcrypt.hash('qwert@123', 10);

  const students = [
    { name: 'Surender M', rollNo: 'MCA24001', email: 'sasidharangr9487@gmail.com', passHash: sasidharanPasswordHash },
    { name: 'Rahul V', rollNo: 'MCA24002', email: 'mca24002@students.kgisl-iim.ac.in', passHash: passwordHash },
    { name: 'Priya Dharshini', rollNo: 'MCA24003', email: 'mca24003@students.kgisl-iim.ac.in', passHash: passwordHash },
    { name: 'Karthik S', rollNo: 'MCA24004', email: 'mca24004@students.kgisl-iim.ac.in', passHash: passwordHash },
    { name: 'Vignesh R', rollNo: 'MCA24005', email: 'mca24005@students.kgisl-iim.ac.in', passHash: passwordHash },
  ];

  for (const s of students) {
    await prisma.student.upsert({
      where: { rollNo: s.rollNo },
      update: {
        email: s.email,
        passwordHash: s.passHash,
      },
      create: {
        name: s.name,
        rollNo: s.rollNo,
        email: s.email,
        passwordHash: s.passHash,
        batchId: batch.id,
      },
    });
  }

  console.log('✅ Seed complete.');
  console.log('   Faculty login: ravi.kumar@kgisl-iim.ac.in / Password@123');
  console.log('   Student login: sasidharangr9487@gmail.com / qwert@123');
  console.log(`   Faculty ID: ${faculty.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
