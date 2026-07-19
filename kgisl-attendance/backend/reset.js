const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.student.updateMany({
    data: { deviceId: null }
  });
  console.log('Cleared all device bindings');
}
run();
