// FeedbackFlow Debug Commands - Database Performance Analysis
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runDebugCommands() {
  console.log('🔍 FeedbackFlow Debug Commands');
  console.log('==============================');
  
  try {
    // 1. Check DB performance with EXPLAIN ANALYZE
    console.log('\n⚡ Database Performance Analysis');
    console.log('--------------------------------');
    
    // Test query performance for pin lookup
    console.log('🎯 Testing pin lookup performance...');
    const explainResult = await prisma.$queryRaw`
      EXPLAIN (ANALYZE, BUFFERS, COSTS, VERBOSE) 
      SELECT * FROM "event_logs" 
      WHERE "pinId" = 'pin123';
    `;
    
    console.log('📊 Query Plan:');
    explainResult.forEach(row => {
      console.log(`  ${row['QUERY PLAN']}`);
    });
    
    // 2. Test retention queries
    console.log('\n⏰ Data Retention Analysis');
    console.log('---------------------------');
    
    // Count records older than 1 year
    const oldEventLogs = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "event_logs" 
      WHERE "timestamp" < NOW() - INTERVAL '1 year';
    `;
    
    const oldUserActivity = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "user_activities" 
      WHERE "timestamp" < NOW() - INTERVAL '1 year';
    `;
    
    console.log(`📊 EventLogs older than 1 year: ${oldEventLogs[0].count}`);
    console.log(`📊 UserActivity older than 1 year: ${oldUserActivity[0].count}`);
    
    // 3. Index usage analysis
    console.log('\n📈 Index Usage Analysis');
    console.log('------------------------');
    
    const indexStats = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes 
      WHERE relname IN ('event_logs', 'user_activities')
      ORDER BY idx_scan DESC;
    `;
    
    console.log('📊 Index Usage Statistics:');
    indexStats.forEach(stat => {
      console.log(`  📁 ${stat.tablename}.${stat.indexname}: ${stat.scans} scans, ${stat.tuples_read} reads`);
    });
    
    // 4. Table size analysis
    console.log('\n💾 Storage Analysis');
    console.log('-------------------');
    
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        t.tablename,
        pg_size_pretty(pg_total_relation_size('public.' || t.tablename)) as total_size,
        pg_size_pretty(pg_relation_size('public.' || t.tablename)) as table_size,
        pg_size_pretty(pg_indexes_size('public.' || t.tablename)) as index_size,
        COALESCE(c.reltuples::bigint, 0) as row_count
      FROM pg_tables t
      LEFT JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public' 
      AND t.tablename IN ('event_logs', 'user_activities', 'pins', 'widget_feedback')
      ORDER BY pg_total_relation_size('public.' || t.tablename) DESC;
    `;
    
    console.log('📊 Table Storage Usage:');
    tableSizes.forEach(table => {
      console.log(`  📁 ${table.tablename}:`);
      console.log(`     Total: ${table.total_size} | Table: ${table.table_size} | Indexes: ${table.index_size}`);
      console.log(`     Rows: ~${table.row_count || 0}`);
    });
    
    // 5. Query performance benchmarks
    console.log('\n🏃 Performance Benchmarks');
    console.log('--------------------------');
    
    const benchmarks = [
      {
        name: 'Recent Events Lookup',
        query: `SELECT * FROM "event_logs" WHERE "timestamp" > NOW() - INTERVAL '24 hours' ORDER BY "timestamp" DESC LIMIT 10;`
      },
      {
        name: 'User Activity by Session',
        query: `SELECT * FROM "user_activities" WHERE "sessionId" IS NOT NULL ORDER BY "timestamp" DESC LIMIT 10;`
      },
      {
        name: 'Event Type Aggregation',
        query: `SELECT "eventType", COUNT(*) as count FROM "event_logs" GROUP BY "eventType" ORDER BY count DESC;`
      }
    ];
    
    for (const benchmark of benchmarks) {
      const start = Date.now();
      try {
        const result = await prisma.$queryRawUnsafe(benchmark.query);
        const duration = Date.now() - start;
        
        console.log(`⚡ ${benchmark.name}: ${duration}ms (${result.length} rows)`);
        
        if (duration > 1000) {
          console.log(`  ⚠️ Slow query detected! Consider optimization.`);
        } else if (duration > 100) {
          console.log(`  📊 Acceptable performance.`);
        } else {
          console.log(`  ✅ Fast query performance.`);
        }
      } catch (error) {
        console.log(`  ❌ Query failed: ${error.message}`);
      }
    }
    
    // 6. Connection and lock analysis
    console.log('\n🔐 Connection & Lock Analysis');
    console.log('-----------------------------');
    
    const connections = await prisma.$queryRaw`
      SELECT 
        datname,
        numbackends as connections,
        xact_commit as commits,
        xact_rollback as rollbacks,
        blks_read,
        blks_hit,
        tup_returned,
        tup_fetched,
        tup_inserted,
        tup_updated,
        tup_deleted
      FROM pg_stat_database 
      WHERE datname = current_database();
    `;
    
    const conn = connections[0];
    console.log(`📊 Database: ${conn.datname}`);
    console.log(`🔗 Active connections: ${conn.connections}`);
    console.log(`✅ Committed transactions: ${conn.commits}`);
    console.log(`❌ Rolled back transactions: ${conn.rollbacks}`);
    console.log(`📖 Cache hit ratio: ${((Number(conn.blks_hit) / (Number(conn.blks_hit) + Number(conn.blks_read))) * 100).toFixed(2)}%`);
    
    // 7. Recent activity summary
    console.log('\n📊 Recent Activity Summary');
    console.log('---------------------------');
    
    const recentEvents = await prisma.$queryRaw`
      SELECT 
        "eventType",
        COUNT(*) as count,
        MAX("timestamp") as latest
      FROM "event_logs" 
      WHERE "timestamp" > NOW() - INTERVAL '24 hours'
      GROUP BY "eventType"
      ORDER BY count DESC;
    `;
    
    if (recentEvents.length > 0) {
      console.log('🎯 Recent Events (24h):');
      recentEvents.forEach(event => {
        console.log(`  📌 ${event.eventType}: ${event.count} events (latest: ${new Date(event.latest).toLocaleString()})`);
      });
    } else {
      console.log('📊 No events in the last 24 hours');
    }
    
    const recentActivity = await prisma.$queryRaw`
      SELECT 
        "action",
        COUNT(*) as count,
        COUNT(DISTINCT "userId") as unique_users,
        MAX("timestamp") as latest
      FROM "user_activities" 
      WHERE "timestamp" > NOW() - INTERVAL '24 hours'
      GROUP BY "action"
      ORDER BY count DESC;
    `;
    
    if (recentActivity.length > 0) {
      console.log('\n👥 Recent User Activity (24h):');
      recentActivity.forEach(activity => {
        console.log(`  🔄 ${activity.action}: ${activity.count} actions by ${activity.unique_users} users (latest: ${new Date(activity.latest).toLocaleString()})`);
      });
    } else {
      console.log('👥 No user activity in the last 24 hours');
    }
    
    await prisma.$disconnect();
    
    console.log('\n==============================');
    console.log('✅ Debug analysis completed!');
    console.log('==============================');
    
  } catch (error) {
    console.error('❌ Debug analysis failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runDebugCommands();
}

module.exports = { runDebugCommands };
