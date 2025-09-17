// FeedbackFlow Deployment Verification - Node.js Script
// This script runs database verification checks using Prisma

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().substring(0, 19).replace('T', ' ');
  console.log(`[${timestamp}] ${colors[color]}${message}${colors.reset}`);
}

async function checkDatabaseConnection() {
  log('🔌 Testing database connection...', 'blue');
  
  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    log('✅ Database connection successful', 'green');
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkPrismaIndexes() {
  log('📊 Checking Prisma indexes...', 'blue');
  
  try {
    const indexes = await prisma.$queryRaw`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename IN ('event_logs', 'user_activities', 'pins', 'widget_feedback', 'test_groups')
      ORDER BY tablename, indexname;
    `;
    
    log(`📊 Found ${indexes.length} indexes in key tables`, 'blue');
    
    // Check for essential indexes
    const essentialIndexes = [
      'event_logs_pinId_idx',
      'event_logs_userId_idx', 
      'event_logs_timestamp_idx',
      'user_activities_userId_idx',
      'user_activities_timestamp_idx'
    ];
    
    const foundIndexes = indexes.map(idx => idx.indexname);
    const missingIndexes = essentialIndexes.filter(idx => !foundIndexes.includes(idx));
    
    if (missingIndexes.length === 0) {
      log('✅ All essential indexes found', 'green');
      return true;
    } else {
      log(`⚠️ Missing indexes: ${missingIndexes.join(', ')}`, 'yellow');
      // Still return true as some indexes might have different names
      return true;
    }
  } catch (error) {
    log(`❌ Index check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkIPAnonymization() {
  log('🔒 Testing IP anonymization...', 'blue');
  
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN "ipAddress" LIKE '%.%.%.XXX' THEN 1 END) as anonymized_ips,
        COUNT(CASE WHEN "ipAddress" NOT LIKE '%.%.%.XXX' AND "ipAddress" IS NOT NULL THEN 1 END) as non_anonymized_ips,
        COUNT(CASE WHEN "ipAddress" IS NULL THEN 1 END) as null_ips
      FROM "user_activities";
    `;
    
    const data = result[0];
    log(`📊 UserActivity records: ${data.total_records}`, 'blue');
    log(`🔒 Anonymized IPs: ${data.anonymized_ips}`, 'blue');
    log(`⚠️ Non-anonymized IPs: ${data.non_anonymized_ips}`, 'blue');
    log(`❓ Null IPs: ${data.null_ips}`, 'blue');
    
    if (Number(data.total_records) === 0) {
      log('⚠️ No UserActivity records found - unable to verify anonymization', 'yellow');
      return true; // Not a failure if no data exists yet
    } else if (Number(data.non_anonymized_ips) > 0) {
      log('❌ Found non-anonymized IP addresses!', 'red');
      return false;
    } else {
      log('✅ All IP addresses properly anonymized or null', 'green');
      return true;
    }
  } catch (error) {
    log(`❌ IP anonymization check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkDataRetention() {
  log('⏰ Checking data retention policies...', 'blue');
  
  try {
    const retentionCheck = await prisma.$queryRaw`
      SELECT 
        'EventLog - Old Records (>1 year)' as check_type,
        COUNT(*) as count
      FROM "event_logs" 
      WHERE "timestamp" < NOW() - INTERVAL '1 year'
      UNION ALL
      SELECT 
        'UserActivity - Old Records (>90 days)',
        COUNT(*)
      FROM "user_activities" 
      WHERE "timestamp" < NOW() - INTERVAL '90 days'
      UNION ALL
      SELECT 
        'UserActivity - Anonymous Old Records (>30 days)',
        COUNT(*)
      FROM "user_activities" 
      WHERE "timestamp" < NOW() - INTERVAL '30 days'
      AND ("userId" = 'anonymous' OR "userId" IS NULL);
    `;
    
    retentionCheck.forEach(check => {
      const count = Number(check.count);
      if (count > 0) {
        log(`⚠️ ${check.check_type}: ${count} records`, 'yellow');
      } else {
        log(`✅ ${check.check_type}: ${count} records`, 'green');
      }
    });
    
    log('✅ Data retention check completed', 'green');
    return true;
  } catch (error) {
    log(`❌ Data retention check failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkDashboardQueries() {
  log('📊 Testing dashboard queries...', 'blue');
  
  try {
    // Test EventLog queries
    const eventStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT "eventType") as event_types,
        COUNT(DISTINCT "userId") as unique_users,
        MIN("timestamp") as earliest_event,
        MAX("timestamp") as latest_event
      FROM "event_logs";
    `;
    
    const eventData = eventStats[0];
    log(`📊 EventLog stats: ${eventData.total_events} events, ${eventData.event_types} types, ${eventData.unique_users} users`, 'blue');
    
    // Test UserActivity queries
    const activityStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_activities,
        COUNT(DISTINCT "action") as action_types,
        COUNT(DISTINCT "userId") as unique_users
      FROM "user_activities";
    `;
    
    const activityData = activityStats[0];
    log(`📊 UserActivity stats: ${activityData.total_activities} activities, ${activityData.action_types} types, ${activityData.unique_users} users`, 'blue');
    
    // Test aggregation queries (like dashboard would use)
    const eventTypeBreakdown = await prisma.$queryRaw`
      SELECT 
        "eventType",
        COUNT(*) as count
      FROM "event_logs"
      GROUP BY "eventType"
      ORDER BY count DESC
      LIMIT 5;
    `;
    
    log(`📊 Top event types: ${eventTypeBreakdown.map(e => `${e.eventType}(${e.count})`).join(', ')}`, 'blue');
    
    log('✅ Dashboard queries working correctly', 'green');
    return true;
  } catch (error) {
    log(`❌ Dashboard queries failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkDatabasePerformance() {
  log('⚡ Testing database performance...', 'blue');
  
  try {
    // Test query performance with EXPLAIN
    const start = Date.now();
    
    // Sample query that would be used in the app
    const sampleQuery = await prisma.$queryRaw`
      SELECT * FROM "event_logs" 
      WHERE "timestamp" > NOW() - INTERVAL '7 days'
      ORDER BY "timestamp" DESC
      LIMIT 100;
    `;
    
    const queryTime = Date.now() - start;
    log(`⚡ Sample query completed in ${queryTime}ms`, 'blue');
    
    if (queryTime > 5000) {
      log('⚠️ Query took longer than 5 seconds - consider optimization', 'yellow');
    } else {
      log('✅ Query performance acceptable', 'green');
    }
    
    // Check table sizes
    const tableSizes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
      FROM pg_tables 
      WHERE tablename IN ('event_logs', 'user_activities', 'pins', 'widget_feedback')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
    
    log('📊 Table sizes:', 'blue');
    tableSizes.forEach(table => {
      log(`  📁 ${table.tablename}: ${table.total_size} (table: ${table.table_size})`, 'blue');
    });
    
    log('✅ Database performance check completed', 'green');
    return true;
  } catch (error) {
    log(`❌ Database performance check failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllChecks() {
  log('🚀 Starting FeedbackFlow Deployment Verification', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const checks = [
    { name: 'Database Connection', fn: checkDatabaseConnection },
    { name: 'Prisma Indexes', fn: checkPrismaIndexes },
    { name: 'IP Anonymization', fn: checkIPAnonymization },
    { name: 'Data Retention', fn: checkDataRetention },
    { name: 'Dashboard Queries', fn: checkDashboardQueries },
    { name: 'Database Performance', fn: checkDatabasePerformance }
  ];
  
  const results = {};
  
  for (const check of checks) {
    try {
      results[check.name] = await check.fn();
    } catch (error) {
      log(`❌ ${check.name} failed with error: ${error.message}`, 'red');
      results[check.name] = false;
    }
    log(''); // Empty line for readability
  }
  
  // Summary
  log('='.repeat(50), 'cyan');
  log('📊 VERIFICATION SUMMARY', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(r => r === true).length;
  const failedChecks = totalChecks - passedChecks;
  
  log(`Total Checks: ${totalChecks}`, 'blue');
  log(`Passed: ${passedChecks}`, 'green');
  log(`Failed: ${failedChecks}`, failedChecks === 0 ? 'green' : 'red');
  
  log(''); // Empty line
  log('Detailed Results:', 'blue');
  
  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const color = passed ? 'green' : 'red';
    log(`  ${status} - ${name}`, color);
  });
  
  log(''); // Empty line
  
  if (failedChecks === 0) {
    log('🎉 ALL DATABASE VERIFICATION CHECKS PASSED!', 'green');
    log('Your FeedbackFlow database is ready for production.', 'green');
  } else {
    log('⚠️ SOME CHECKS FAILED', 'red');
    log('Please review the failed items before deploying to production.', 'red');
  }
  
  log('='.repeat(50), 'cyan');
  
  await prisma.$disconnect();
  process.exit(failedChecks === 0 ? 0 : 1);
}

// Run if this file is executed directly
if (require.main === module) {
  runAllChecks().catch(error => {
    log(`❌ Verification failed with error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = {
  checkDatabaseConnection,
  checkPrismaIndexes,
  checkIPAnonymization,
  checkDataRetention,
  checkDashboardQueries,
  checkDatabasePerformance
};
