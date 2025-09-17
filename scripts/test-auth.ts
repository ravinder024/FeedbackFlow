import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testAuth() {
  try {
    // 1. Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // 2. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'ravinderk.pro@gmail.com' },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        name: true,
        createdAt: true
      }
    });

    console.log('\nUser lookup result:', {
      exists: !!user,
      email: user?.email,
      role: user?.role,
      hasPasswordHash: !!user?.passwordHash,
      createdAt: user?.createdAt
    });

    if (!user) {
      console.log('\n❌ User not found. Creating admin user...');
      
      // Create new admin user
      const passwordHash = await bcrypt.hash('feedbackflow@890', 10);
      const newUser = await prisma.user.create({
        data: {
          email: 'ravinderk.pro@gmail.com',
          name: 'Ravinder',
          role: 'ADMIN',
          passwordHash,
          companyName: 'Admin Company',
          designation: 'Administrator',
          privacyAcceptedAt: new Date()
        }
      });
      
      console.log('✅ Admin user created:', {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      });
    } else {
      // Test password
      console.log('\nTesting password authentication...');
      if (!user.passwordHash) {
        console.log('❌ No password hash found');
      } else {
        const isValid = await bcrypt.compare('feedbackflow@890', user.passwordHash);
        console.log('Password validation result:', isValid ? '✅ Valid' : '❌ Invalid');
        
        if (!isValid) {
          console.log('\nUpdating password...');
          const newPasswordHash = await bcrypt.hash('feedbackflow@890', 10);
          await prisma.user.update({
            where: { email: 'ravinderk.pro@gmail.com' },
            data: { passwordHash: newPasswordHash }
          });
          console.log('✅ Password updated');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
