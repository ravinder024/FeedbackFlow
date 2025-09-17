import { PrismaClient } from '@prisma/client';
import { UserRole } from '@/types/roles';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash the admin password
  const passwordHash = await bcrypt.hash('feedbackflow@890', 10);

  // Create an admin user
  const admin = await prisma.user.upsert({
    where: { email: 'ravinderk.pro@gmail.com' },
    update: {
      name: 'Ravinder',
      role: UserRole.ADMIN,
      passwordHash,
      companyName: 'Admin Company',
      designation: 'Administrator',
      privacyAcceptedAt: new Date(),
    },
    create: {
      email: 'ravinderk.pro@gmail.com',
      name: 'Ravinder',
      role: UserRole.ADMIN,
      passwordHash,
      companyName: 'Admin Company',
      designation: 'Administrator',
      privacyAcceptedAt: new Date(),
    },
  });

  // Create a test group for gmail.com
  const testGroup = await prisma.userTestGroup.create({
    data: {
      name: 'Gmail Test Group',
      domain: 'gmail.com',
      description: 'Test group for Gmail users',
      moderatorId: admin.id,
    },
  });

  console.log('Created/updated admin:', admin);
  console.log('Created test group:', testGroup);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 