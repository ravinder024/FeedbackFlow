import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function runDiagnostics() {
  try {
    console.log('🔍 Starting Authentication System Diagnostics\n');

    // 1. Database Connection Test
    console.log('1️⃣ Testing Database Connection...');
    try {
      await prisma.$connect();
      console.log('✅ Database connection successful');
      
      // Test query
      const count = await prisma.user.count();
      console.log(`✅ Database query successful. Total users: ${count}`);
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }

    // 2. Schema Validation
    console.log('\n2️⃣ Validating User Schema...');
    const userTableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users';
    `;
    console.log('User table structure:', userTableInfo);

    // 3. Check Admin User
    console.log('\n3️⃣ Checking Admin User...');
    const admin = await prisma.user.findUnique({
      where: { email: 'ravinderk.pro@gmail.com' },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (admin) {
      console.log('Admin user found:', {
        ...admin,
        passwordHash: admin.passwordHash ? '**PRESENT**' : '**MISSING**'
      });

      // 4. Verify Password Hash
      if (admin.passwordHash) {
        console.log('\n4️⃣ Testing Password Hash...');
        try {
          const isValid = await bcrypt.compare('123456', admin.passwordHash);
          console.log('Password validation:', isValid ? '✅ Valid' : '❌ Invalid');
          console.log('Password hash format check:', admin.passwordHash.startsWith('$2') ? '✅ Valid bcrypt' : '❌ Invalid format');
        } catch (error) {
          console.error('❌ Password hash validation error:', error);
        }
      }

      // 5. Check Role Assignment
      console.log('\n5️⃣ Verifying Role Assignment...');
      if (admin.role === Role.ADMIN) {
        console.log('✅ Role correctly set to ADMIN');
      } else {
        console.log(`❌ Incorrect role: ${admin.role}`);
      }
    } else {
      console.log('❌ Admin user not found');
    }

    // 6. Check NextAuth Tables
    console.log('\n6️⃣ Verifying NextAuth Tables...');
    const [sessionCount, accountCount] = await Promise.all([
      prisma.session.count(),
      prisma.account.count()
    ]);
    console.log(`Sessions: ${sessionCount}, Accounts: ${accountCount}`);

    // 7. Create Fresh Admin Test
    console.log('\n7️⃣ Creating Fresh Admin Test...');
    const passwordHash = await bcrypt.hash('123456', 10);
    
    // Delete existing admin first
    await prisma.user.deleteMany({
      where: { email: 'ravinderk.pro@gmail.com' }
    });

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

    console.log('New admin created:', {
      ...newAdmin,
      passwordHash: '**HIDDEN**'
    });

    // 8. Final Verification
    console.log('\n8️⃣ Final Verification...');
    const finalCheck = await prisma.user.findUnique({
      where: { email: 'ravinderk.pro@gmail.com' },
      select: { id: true, email: true, role: true }
    });
    console.log('Final admin state:', finalCheck);

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostics();
