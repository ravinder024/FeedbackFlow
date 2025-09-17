const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'ravinderk.pro@gmail.com' },
    data: { passwordHash: '$2b$10$s.IdPU2ts0Pe.qBs7EfYnOKhpojn.5q9TJ3oHmTOedvjkHDUubzB6' }
  });
  console.log('Admin password updated to 123456');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
