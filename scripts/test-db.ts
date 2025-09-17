import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    // Test connection
    await prisma.$connect();
    console.log('Successfully connected to database');

    // Create admin user
    const passwordHash = await bcrypt.hash('feedbackflow@890', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'ravinderk.pro@gmail.com',
        name: 'Ravinder',
        role: 'ADMIN',
        passwordHash,
        companyName: 'Admin Company',
        designation: 'Administrator',
        privacyAcceptedAt: new Date(),
      }
    });

    console.log('Admin created:', admin);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
