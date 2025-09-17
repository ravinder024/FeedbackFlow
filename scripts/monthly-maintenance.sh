#!/bin/bash

# FeedbackFlow Log Rotation and Backup Automation Script
# This script handles database cleanup and automated backups

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="/var/log/feedbackflow/maintenance.log"
LOCK_FILE="/tmp/feedbackflow-maintenance.lock"

# Database configuration (from environment or defaults)
DB_NAME="${FEEDBACKFLOW_DB_NAME:-feedbackflow}"
DB_USER="${FEEDBACKFLOW_DB_USER:-feedbackflow_user}"
DB_HOST="${FEEDBACKFLOW_DB_HOST:-localhost}"
DB_PORT="${FEEDBACKFLOW_DB_PORT:-5432}"

# S3 configuration
S3_BUCKET="${FEEDBACKFLOW_S3_BUCKET:-feedbackflow-backups}"
S3_PREFIX="${FEEDBACKFLOW_S3_PREFIX:-logs}"

# Retention settings
BACKUP_RETENTION_DAYS=90
LOG_RETENTION_DAYS=365

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "ERROR: $1"
    cleanup
    exit 1
}

# Cleanup function
cleanup() {
    if [[ -f "$LOCK_FILE" ]]; then
        rm -f "$LOCK_FILE"
    fi
}

# Trap for cleanup on exit
trap cleanup EXIT

# Check if script is already running
if [[ -f "$LOCK_FILE" ]]; then
    if kill -0 "$(cat "$LOCK_FILE")" 2>/dev/null; then
        log "Maintenance script is already running (PID: $(cat "$LOCK_FILE"))"
        exit 1
    else
        log "Removing stale lock file"
        rm -f "$LOCK_FILE"
    fi
fi

# Create lock file
echo $$ > "$LOCK_FILE"

log "Starting FeedbackFlow maintenance script"

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    command -v psql >/dev/null 2>&1 || missing_deps+=("psql")
    command -v pg_dump >/dev/null 2>&1 || missing_deps+=("pg_dump")
    command -v aws >/dev/null 2>&1 || missing_deps+=("aws")
    
    if [[ ${#missing_deps[@]} -ne 0 ]]; then
        handle_error "Missing dependencies: ${missing_deps[*]}"
    fi
}

# Test database connection
test_db_connection() {
    log "Testing database connection..."
    if ! PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        handle_error "Cannot connect to database"
    fi
    log "Database connection successful"
}

# Run log rotation
run_log_rotation() {
    log "Starting log rotation..."
    
    local rotation_output
    rotation_output=$(PGPASSWORD="$PGPASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/log-rotation.sql" 2>&1)
    local exit_code=$?
    
    if [[ $exit_code -eq 0 ]]; then
        log "Log rotation completed successfully"
        echo "$rotation_output" >> "$LOG_FILE"
    else
        handle_error "Log rotation failed: $rotation_output"
    fi
}

# Create backup before log rotation
create_backup() {
    log "Creating database backup before log rotation..."
    
    local backup_file="feedbackflow_pre_rotation_$(date +%Y%m%d_%H%M%S).sql"
    local backup_path="/tmp/$backup_file"
    
    if PGPASSWORD="$PGPASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_path"; then
        log "Backup created: $backup_path"
        
        # Compress backup
        if gzip "$backup_path"; then
            backup_path="${backup_path}.gz"
            log "Backup compressed: $backup_path"
        fi
        
        # Upload to S3
        if upload_to_s3 "$backup_path" "$S3_PREFIX/pre-rotation/"; then
            log "Backup uploaded to S3"
            rm -f "$backup_path"
        else
            log "WARNING: Failed to upload backup to S3, keeping local copy"
        fi
    else
        handle_error "Failed to create backup"
    fi
}

# Upload file to S3
upload_to_s3() {
    local file_path="$1"
    local s3_prefix="$2"
    local filename=$(basename "$file_path")
    
    if aws s3 cp "$file_path" "s3://$S3_BUCKET/$s3_prefix$filename" >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Clean up old backups from S3
cleanup_old_backups() {
    log "Cleaning up old backups from S3..."
    
    local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%Y-%m-%d)
    
    # List and delete old backups
    aws s3api list-objects-v2 \
        --bucket "$S3_BUCKET" \
        --prefix "$S3_PREFIX/" \
        --query "Contents[?LastModified<='$cutoff_date'].{Key: Key}" \
        --output text | while read -r key; do
        
        if [[ -n "$key" && "$key" != "None" ]]; then
            if aws s3 rm "s3://$S3_BUCKET/$key" >/dev/null 2>&1; then
                log "Deleted old backup: $key"
            else
                log "WARNING: Failed to delete backup: $key"
            fi
        fi
    done
}

# Send notification (placeholder for future email/slack integration)
send_notification() {
    local status="$1"
    local message="$2"
    
    # For now, just log the notification
    log "NOTIFICATION [$status]: $message"
    
    # Future: Implement email/Slack notifications
    # curl -X POST "$SLACK_WEBHOOK_URL" -H 'Content-type: application/json' \
    #      --data "{\"text\":\"FeedbackFlow Maintenance [$status]: $message\"}"
}

# Main execution
main() {
    log "=== FeedbackFlow Monthly Maintenance Started ==="
    
    # Check dependencies
    check_dependencies
    
    # Test database connection
    test_db_connection
    
    # Create backup before rotation
    create_backup
    
    # Run log rotation
    run_log_rotation
    
    # Clean up old backups
    cleanup_old_backups
    
    # Run weekly backup script for good measure
    if [[ -f "$SCRIPT_DIR/backup.sh" ]]; then
        log "Running weekly backup script..."
        bash "$SCRIPT_DIR/backup.sh"
    fi
    
    log "=== FeedbackFlow Monthly Maintenance Completed ==="
    
    send_notification "SUCCESS" "Monthly maintenance completed successfully"
}

# Parse command line arguments
case "${1:-}" in
    --dry-run)
        log "DRY RUN MODE: Would perform log rotation and backup"
        exit 0
        ;;
    --rotation-only)
        log "Running log rotation only..."
        check_dependencies
        test_db_connection
        run_log_rotation
        exit 0
        ;;
    --backup-only)
        log "Running backup only..."
        check_dependencies
        test_db_connection
        create_backup
        exit 0
        ;;
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo "Options:"
        echo "  --dry-run        Show what would be done without executing"
        echo "  --rotation-only  Run only log rotation"
        echo "  --backup-only    Run only backup creation"
        echo "  --help, -h       Show this help message"
        exit 0
        ;;
    "")
        # No arguments, run full maintenance
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
