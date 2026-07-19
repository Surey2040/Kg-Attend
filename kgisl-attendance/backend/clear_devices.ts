import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.student.updateMany({
    data: { deviceId: null }
  });
  console.log("SUCCESS: All student device IDs have been cleared!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
