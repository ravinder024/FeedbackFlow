const { prisma } = require('./src/lib/prisma'); // Corrected path to Prisma client

(async function() {
  try {
    const tg = process.env.TESTGROUP;
    if (!tg) return console.error('MISSING TESTGROUP');

    const c = await prisma.eventLog.count({ where: { testGroupId: tg } });
    console.log('DB COUNT —', c);

    const sample = await prisma.eventLog.findFirst({ where: { testGroupId: tg }, take: 1 });
    console.log('SAMPLE —', sample ? JSON.stringify({ id: sample.id, pageUrl: sample.pageUrl, pinId: sample.pinId, eventType: sample.eventType }) : 'null');
  } catch (err) {
    console.error('ERROR —', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
})();