import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function resetAndCreateAdmin() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected to database');

    console.log('\nResetting user...');
    await prisma.user.deleteMany({
      where: { email: 'ravinderk.pro@gmail.com' }
    });
    console.log('✅ User reset complete');

    console.log('\nCreating new admin user...');
    const passwordHash = await bcrypt.hash('123456', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'ravinderk.pro@gmail.com',
        name: 'Ravinder',
        role: Role.ADMIN,
        passwordHash,
        companyName: 'Admin Company',
        designation: 'Administrator',
        privacyAcceptedAt: new Date(),
      },
    });

    console.log('✅ Admin user created:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      hasPasswordHash: !!admin.passwordHash
    });

    // Verify the password works
    console.log('\nVerifying password...');
    const user = await prisma.user.findUnique({
      where: { email: 'ravinderk.pro@gmail.com' },
      select: { passwordHash: true }
    });

    if (user && user.passwordHash) {
      const isValid = await bcrypt.compare('123456', user.passwordHash);
      console.log('Password verification:', isValid ? '✅ Valid' : '❌ Invalid');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndCreateAdmin();
