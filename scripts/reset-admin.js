const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdmin() {
    try {
        // 1. Delete existing admin user if exists
        await prisma.user.deleteMany({
            where: { email: 'ravinderk.pro@gmail.com' }
        });
        console.log('✅ Deleted existing admin user');

        // 2. Create new password hash
        const password = '123456';
        const passwordHash = await bcrypt.hash(password, 10);
        console.log('✅ Created new password hash');

        // 3. Create new admin user
        const admin = await prisma.user.create({
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
        console.log('✅ Created new admin user:', {
            id: admin.id,
            email: admin.email,
            role: admin.role
        });

        // 4. Verify the password works
        const user = await prisma.user.findUnique({
            where: { email: 'ravinderk.pro@gmail.com' },
            select: { passwordHash: true }
        });

        if (user) {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            console.log('✅ Password verification:', isValid ? 'SUCCESS' : 'FAILED');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
