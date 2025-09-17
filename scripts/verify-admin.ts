import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function verifyAdminSetup() {
  try {
    console.log('🔍 Starting admin verification...');
    
    // 1. Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'ravinderk.pro@gmail.com' },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        name: true,
      }
    });

    if (!admin) {
      console.log('❌ Admin not found, creating...');
      
      // Create admin
      const passwordHash = await bcrypt.hash('123456', 10);
      const newAdmin = await prisma.user.create({
        data: {
          email: 'ravinderk.pro@gmail.com',
          name: 'Ravinder',
          role: Role.ADMIN,
          passwordHash,
          companyName: 'Admin Company',
          designation: 'Administrator',
          privacyAcceptedAt: new Date()
        }
      });

      console.log('✅ Admin created:', {
        id: newAdmin.id,
        email: newAdmin.email,
        role: newAdmin.role
      });

      // Verify password works
      if (newAdmin.passwordHash) {
        const verifyHash = await bcrypt.compare('123456', newAdmin.passwordHash);
        console.log('🔐 Password verification:', verifyHash ? 'Valid' : 'Invalid');
      }
      
    } else {
      console.log('Found existing admin:', {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        hasPassword: !!admin.passwordHash
      });

      // Test current password
      if (admin.passwordHash) {
        const isValid = await bcrypt.compare('123456', admin.passwordHash);
        console.log('🔐 Current password valid:', isValid);

        if (!isValid) {
          console.log('Updating password...');
          const newHash = await bcrypt.hash('123456', 10);
          await prisma.user.update({
            where: { id: admin.id },
            data: { passwordHash: newHash }
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

verifyAdminSetup();
