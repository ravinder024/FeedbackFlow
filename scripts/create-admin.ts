import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const passwordHash = await bcrypt.hash('feedbackflow@890', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'ravinderk.pro@gmail.com' },
      update: {
        name: 'Ravinder',
        role: 'ADMIN',
        passwordHash,
        companyName: 'Admin Company',
        designation: 'Administrator',
        privacyAcceptedAt: new Date(),
      },
      create: {
        email: 'ravinderk.pro@gmail.com',
        name: 'Ravinder',
        role: 'ADMIN',
        passwordHash,
        companyName: 'Admin Company',
        designation: 'Administrator',
        privacyAcceptedAt: new Date(),
      },
    });

    console.log('Admin user created/updated:', admin);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
