// Check what tables exist in the database
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...');
    
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `;
    
    console.log('\n📊 Found tables:');
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.tablename}`);
    });
    
    // Check specifically for event logging tables
    const eventTables = tables.filter(t => 
      t.tablename.includes('event') || 
      t.tablename.includes('activity') ||
      t.tablename.includes('log')
    );
    
    console.log('\n🔍 Event/Activity related tables:');
    if (eventTables.length === 0) {
      console.log('  ❌ No event logging tables found!');
      console.log('  📝 Expected: event_logs, user_activities');
    } else {
      eventTables.forEach(table => {
        console.log(`  ✅ ${table.tablename}`);
      });
    }
    
    // Try to find tables with correct Prisma naming
    const allTableNames = tables.map(t => t.tablename);
    const expectedTables = ['event_logs', 'user_activities'];
    
    console.log('\n🎯 Checking expected event logging tables:');
    expectedTables.forEach(expectedTable => {
      if (allTableNames.includes(expectedTable)) {
        console.log(`  ✅ ${expectedTable} - EXISTS`);
      } else {
        console.log(`  ❌ ${expectedTable} - MISSING`);
      }
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkTables();
