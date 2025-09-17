-- FeedbackFlow Database Verification Script
-- This script checks all verification items from the deployment checklist

-- 1. Check all Prisma indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('event_logs', 'user_activities', 'pins', 'widget_feedback', 'test_groups')
ORDER BY tablename, indexname;

-- Check specific EventLog indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'event_logs'
ORDER BY indexname;

-- 2. Test EventLog query performance (sample query)
EXPLAIN ANALYZE 
SELECT * FROM "EventLog" 
WHERE "pinId" = 'sample-pin-123' 
LIMIT 10;

-- 3. Check data retention - count old records
SELECT 
    'EventLog - Old Records (>1 year)' as check_type,
    COUNT(*) as count
FROM "EventLog" 
WHERE "timestamp" < NOW() - INTERVAL '1 year'
UNION ALL
SELECT 
    'UserActivity - Old Records (>90 days)',
    COUNT(*)
FROM "UserActivity" 
WHERE "timestamp" < NOW() - INTERVAL '90 days'
UNION ALL
SELECT 
    'UserActivity - Anonymous Old Records (>30 days)',
    COUNT(*)
FROM "UserActivity" 
WHERE "timestamp" < NOW() - INTERVAL '30 days'
AND ("userId" = 'anonymous' OR "userId" IS NULL);

-- 4. Check table statistics and health
SELECT 
    schemaname,
    relname as table_name,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables 
WHERE relname IN ('event_logs', 'user_activities', 'pins', 'widget_feedback')
ORDER BY relname;

-- 5. Check EventLog data distribution
SELECT 
    "eventType",
    COUNT(*) as count,
    MIN("timestamp") as earliest,
    MAX("timestamp") as latest
FROM "EventLog"
GROUP BY "eventType"
ORDER BY count DESC;

-- 6. Check UserActivity data distribution
SELECT 
    "action",
    COUNT(*) as count,
    COUNT(DISTINCT "userId") as unique_users,
    MIN("timestamp") as earliest,
    MAX("timestamp") as latest
FROM "UserActivity"
GROUP BY "action"
ORDER BY count DESC;

-- 7. Verify IP anonymization in UserActivity
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN "ipAddress" LIKE '%.%.%.XXX' THEN 1 END) as anonymized_ips,
    COUNT(CASE WHEN "ipAddress" NOT LIKE '%.%.%.XXX' AND "ipAddress" IS NOT NULL THEN 1 END) as non_anonymized_ips,
    COUNT(CASE WHEN "ipAddress" IS NULL THEN 1 END) as null_ips
FROM "UserActivity";

-- 8. Check database size and table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename IN ('event_logs', 'user_activities', 'pins', 'widget_feedback', 'test_groups')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
