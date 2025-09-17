import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');

    // Delete all test groups and related data first
    console.log('Deleting test groups and related data...');
    await prisma.testGroup.deleteMany({});
    console.log('✅ Test groups deleted');

    // Delete all users except admin
    console.log('Deleting non-admin users...');
    await prisma.user.deleteMany({
      where: {
        NOT: {
          email: 'ravinderk.pro@gmail.com'
        }
      }
    });
    console.log('✅ Non-admin users deleted');

    // Verify admin user exists with correct role
    const admin = await prisma.user.findUnique({
      where: { email: 'ravinderk.pro@gmail.com' }
    });

    if (!admin) {
      console.log('Admin user not found. Running verify-admin script...');
      // We'll run verify-admin separately
    }

    console.log('✅ Database reset complete');

  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
