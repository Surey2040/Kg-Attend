const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@kgisliim.ac.in' },
    update: { passwordHash },
    create: {
      name: 'Super Admin',
      email: 'admin@kgisliim.ac.in',
      passwordHash,
    },
  });
  console.log('Admin seeded:', admin);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
