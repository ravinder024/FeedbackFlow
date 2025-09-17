import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const hashedPassword = await bcrypt.hash('feedbackflow@890', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'ravinderk.pro@gmail.com' },
    update: {
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'ravinderk.pro@gmail.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
