const { prisma } = require('./src/lib/prisma');

async function run() {
  try {
    const tg = process.env.TESTGROUP;
    if (!tg) {
      console.error('MISSING TESTGROUP env var');
      process.exit(2);
    }
    const c = await prisma.eventLog.count({ where: { testGroupId: tg } });
    console.log('DB COUNT —', c);
  } catch (err) {
    console.error('ERROR —', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();