-- FeedbackFlow Database Log Rotation and Cleanup Script
-- This script manages data retention policies for event logs and user activities

-- Set variables for retention periods (in days)
\set event_retention_days 365
\set activity_retention_days 90
\set anonymous_activity_retention_days 30

-- Start transaction
BEGIN;

-- Log cleanup start
DO $$
BEGIN
    RAISE NOTICE 'Starting FeedbackFlow log rotation at %', NOW();
END $$;

-- Create temp table for cleanup statistics
CREATE TEMP TABLE cleanup_stats (
    table_name TEXT,
    records_before BIGINT,
    records_deleted BIGINT,
    records_after BIGINT,
    cleanup_timestamp TIMESTAMP DEFAULT NOW()
);

-- Cleanup EventLog table (1 year retention)
DO $$
DECLARE
    records_before BIGINT;
    records_deleted BIGINT;
    records_after BIGINT;
    cutoff_date TIMESTAMP;
BEGIN
    -- Calculate cutoff date
    cutoff_date := NOW() - INTERVAL '365 days';
    
    -- Count records before cleanup
    SELECT COUNT(*) INTO records_before FROM "EventLog";
    
    -- Delete old event logs
    DELETE FROM "EventLog" 
    WHERE timestamp < cutoff_date;
    
    GET DIAGNOSTICS records_deleted = ROW_COUNT;
    
    -- Count records after cleanup
    SELECT COUNT(*) INTO records_after FROM "EventLog";
    
    -- Record statistics
    INSERT INTO cleanup_stats (table_name, records_before, records_deleted, records_after)
    VALUES ('EventLog', records_before, records_deleted, records_after);
    
    RAISE NOTICE 'EventLog cleanup: % records deleted (before: %, after: %)', 
                 records_deleted, records_before, records_after;
END $$;

-- Cleanup UserActivity table (90 days for authenticated users, 30 days for anonymous)
DO $$
DECLARE
    records_before BIGINT;
    records_deleted_anon BIGINT;
    records_deleted_auth BIGINT;
    records_after BIGINT;
    total_deleted BIGINT;
    cutoff_date_anon TIMESTAMP;
    cutoff_date_auth TIMESTAMP;
BEGIN
    -- Calculate cutoff dates
    cutoff_date_anon := NOW() - INTERVAL '30 days';  -- Anonymous users
    cutoff_date_auth := NOW() - INTERVAL '90 days';  -- Authenticated users
    
    -- Count records before cleanup
    SELECT COUNT(*) INTO records_before FROM "UserActivity";
    
    -- Delete old anonymous user activities (30 days)
    DELETE FROM "UserActivity" 
    WHERE timestamp < cutoff_date_anon 
    AND (userId = 'anonymous' OR userId IS NULL);
    
    GET DIAGNOSTICS records_deleted_anon = ROW_COUNT;
    
    -- Delete old authenticated user activities (90 days)
    DELETE FROM "UserActivity" 
    WHERE timestamp < cutoff_date_auth 
    AND userId != 'anonymous' 
    AND userId IS NOT NULL;
    
    GET DIAGNOSTICS records_deleted_auth = ROW_COUNT;
    
    total_deleted := records_deleted_anon + records_deleted_auth;
    
    -- Count records after cleanup
    SELECT COUNT(*) INTO records_after FROM "UserActivity";
    
    -- Record statistics
    INSERT INTO cleanup_stats (table_name, records_before, records_deleted, records_after)
    VALUES ('UserActivity', records_before, total_deleted, records_after);
    
    RAISE NOTICE 'UserActivity cleanup: % anonymous + % authenticated = % total deleted (before: %, after: %)', 
                 records_deleted_anon, records_deleted_auth, total_deleted, records_before, records_after;
END $$;

-- Cleanup old sessions (sessions older than 1 year)
DO $$
DECLARE
    records_before BIGINT;
    records_deleted BIGINT;
    records_after BIGINT;
    cutoff_date TIMESTAMP;
BEGIN
    -- Only run if Session table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Session') THEN
        cutoff_date := NOW() - INTERVAL '365 days';
        
        SELECT COUNT(*) INTO records_before FROM "Session";
        
        DELETE FROM "Session" 
        WHERE expires < cutoff_date;
        
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        
        SELECT COUNT(*) INTO records_after FROM "Session";
        
        INSERT INTO cleanup_stats (table_name, records_before, records_deleted, records_after)
        VALUES ('Session', records_before, records_deleted, records_after);
        
        RAISE NOTICE 'Session cleanup: % records deleted (before: %, after: %)', 
                     records_deleted, records_before, records_after;
    END IF;
END $$;

-- Cleanup old verification tokens (tokens older than 30 days)
DO $$
DECLARE
    records_before BIGINT;
    records_deleted BIGINT;
    records_after BIGINT;
    cutoff_date TIMESTAMP;
BEGIN
    -- Only run if VerificationToken table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'VerificationToken') THEN
        cutoff_date := NOW() - INTERVAL '30 days';
        
        SELECT COUNT(*) INTO records_before FROM "VerificationToken";
        
        DELETE FROM "VerificationToken" 
        WHERE expires < cutoff_date;
        
        GET DIAGNOSTICS records_deleted = ROW_COUNT;
        
        SELECT COUNT(*) INTO records_after FROM "VerificationToken";
        
        INSERT INTO cleanup_stats (table_name, records_before, records_deleted, records_after)
        VALUES ('VerificationToken', records_before, records_deleted, records_after);
        
        RAISE NOTICE 'VerificationToken cleanup: % records deleted (before: %, after: %)', 
                     records_deleted, records_before, records_after;
    END IF;
END $$;

-- Update table statistics after cleanup
ANALYZE "EventLog";
ANALYZE "UserActivity";

-- Display cleanup summary
DO $$
DECLARE
    rec RECORD;
    total_deleted BIGINT := 0;
BEGIN
    RAISE NOTICE '=== FeedbackFlow Log Rotation Summary ===';
    
    FOR rec IN SELECT * FROM cleanup_stats ORDER BY table_name LOOP
        RAISE NOTICE '% - Deleted: %, Remaining: %', 
                     rec.table_name, rec.records_deleted, rec.records_after;
        total_deleted := total_deleted + rec.records_deleted;
    END LOOP;
    
    RAISE NOTICE 'Total records deleted across all tables: %', total_deleted;
    RAISE NOTICE 'Log rotation completed at %', NOW();
END $$;

-- Vacuum tables to reclaim space
VACUUM ANALYZE "EventLog";
VACUUM ANALYZE "UserActivity";

-- Commit transaction
COMMIT;

-- Optional: Create a log entry in a dedicated maintenance log table
-- (This would require creating a MaintenanceLog table first)
/*
INSERT INTO "MaintenanceLog" (operation, details, timestamp)
VALUES (
    'log_rotation',
    jsonb_build_object(
        'event_logs_deleted', (SELECT records_deleted FROM cleanup_stats WHERE table_name = 'EventLog'),
        'user_activities_deleted', (SELECT records_deleted FROM cleanup_stats WHERE table_name = 'UserActivity'),
        'total_deleted', (SELECT SUM(records_deleted) FROM cleanup_stats)
    ),
    NOW()
);
*/
