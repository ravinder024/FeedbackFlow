#!/bin/bash

# FeedbackFlow Database Restoration Script
# This script restores a PostgreSQL database from a backup file

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-feedbackflow}
DB_USER=${DB_USER:-postgres}
S3_BUCKET=${S3_BUCKET:-feedbackflow-backups}

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS] <backup_file_or_s3_path>"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -s, --from-s3       Download backup from S3 first"
    echo "  -l, --list-backups  List available backups in S3"
    echo "  -d, --drop-existing Drop existing database before restore"
    echo ""
    echo "Examples:"
    echo "  $0 ./backups/feedbackflow_backup_20240806_123456.sql"
    echo "  $0 -s s3://feedbackflow-backups/backups/feedbackflow_backup_20240806_123456.sql"
    echo "  $0 -l  # List available backups"
    exit 1
}

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Parse command line arguments
LIST_BACKUPS=false
FROM_S3=false
DROP_EXISTING=false
BACKUP_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -l|--list-backups)
            LIST_BACKUPS=true
            shift
            ;;
        -s|--from-s3)
            FROM_S3=true
            shift
            ;;
        -d|--drop-existing)
            DROP_EXISTING=true
            shift
            ;;
        -*)
            echo "Unknown option $1"
            usage
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# List backups function
list_backups() {
    if ! command -v aws &> /dev/null; then
        log "ERROR: AWS CLI is not installed"
        exit 1
    fi
    
    log "Available backups in S3:"
    aws s3 ls "s3://$S3_BUCKET/backups/" --recursive | grep "\.sql$" | sort -r
    exit 0
}

# Handle list backups request
if [ "$LIST_BACKUPS" = true ]; then
    list_backups
fi

# Validate backup file argument
if [ -z "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file is required"
    usage
fi

log "Starting FeedbackFlow database restoration..."
log "Target database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# Check if PostgreSQL client tools are available
if ! command -v pg_restore &> /dev/null; then
    log "ERROR: pg_restore is not installed or not in PATH"
    exit 1
fi

# Download from S3 if requested
if [ "$FROM_S3" = true ]; then
    if ! command -v aws &> /dev/null; then
        log "ERROR: AWS CLI is not installed"
        exit 1
    fi
    
    # Extract filename from S3 path
    LOCAL_FILE="./$(basename "$BACKUP_FILE")"
    
    log "Downloading backup from S3: $BACKUP_FILE"
    aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"
    
    if [ $? -eq 0 ]; then
        log "Download completed: $LOCAL_FILE"
        BACKUP_FILE="$LOCAL_FILE"
    else
        log "ERROR: Failed to download backup from S3"
        exit 1
    fi
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
log "Backup file size: $(numfmt --to=iec $BACKUP_SIZE)"

# Drop existing database if requested
if [ "$DROP_EXISTING" = true ]; then
    log "WARNING: Dropping existing database: $DB_NAME"
    read -p "Are you sure you want to drop the existing database? (yes/no): " confirmation
    
    if [ "$confirmation" = "yes" ]; then
        # Terminate existing connections
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d postgres -c \
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME';" || true
        
        # Drop database
        dropdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" || true
        
        # Create new database
        createdb -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME"
        
        log "Database recreated: $DB_NAME"
    else
        log "Database drop cancelled"
        exit 1
    fi
fi

# Restore database
log "Restoring database from backup..."
if [ -n "$PGPASSWORD" ]; then
    # Use password from environment
    pg_restore -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
        --verbose --no-password --clean --if-exists \
        "$BACKUP_FILE" 2>&1 | while read line; do log "$line"; done
else
    # Prompt for password or use .pgpass
    pg_restore -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
        --verbose --clean --if-exists \
        "$BACKUP_FILE" 2>&1 | while read line; do log "$line"; done
fi

if [ $? -eq 0 ]; then
    log "Database restoration completed successfully"
else
    log "ERROR: Database restoration failed"
    exit 1
fi

# Clean up downloaded file if it came from S3
if [ "$FROM_S3" = true ] && [ -f "$LOCAL_FILE" ]; then
    log "Cleaning up downloaded backup file"
    rm -f "$LOCAL_FILE"
fi

log "Restoration process completed"
