"use strict";
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Crispycrust@99', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'ravinderk.pro@gmail.com' },
    update: {
      name: 'Ravinder',
      role: Role.ADMIN,
      passwordHash: passwordHash,
      companyName: 'Admin Company',
      designation: 'Administrator',
      privacyAcceptedAt: new Date(),
    },
    create: {
      email: 'ravinderk.pro@gmail.com',
      name: 'Ravinder',
      role: Role.ADMIN,
      passwordHash: passwordHash,
      companyName: 'Admin Company',
      designation: 'Administrator',
      privacyAcceptedAt: new Date(),
    },
  });

  // Create test group
  const testGroup = await prisma.testGroup.create({
    data: {
      name: 'Gmail Test Group',
      domain: 'gmail.com',
      description: 'Test group for Gmail users',
      moderatorId: admin.id,
    },
  });

  // Create test group member
  await prisma.testGroupMember.create({
    data: {
      userId: admin.id,
      testGroupId: testGroup.id,
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
