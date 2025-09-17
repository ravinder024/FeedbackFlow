#!/bin/bash

# FeedbackFlow Database Backup Script
# This script creates automated backups of the PostgreSQL database
# and uploads them to AWS S3 with proper retention policies

set -e  # Exit on any error

# Configuration from environment variables
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-feedbackflow}
DB_USER=${DB_USER:-postgres}
S3_BUCKET=${S3_BUCKET:-feedbackflow-backups}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
LOCAL_BACKUP_DIR=${LOCAL_BACKUP_DIR:-./backups}

# Create backup directory if it doesn't exist
mkdir -p "$LOCAL_BACKUP_DIR"

# Generate timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EPOCH_TIME=$(date +%s)
BACKUP_FILE="feedbackflow_backup_${TIMESTAMP}_${EPOCH_TIME}.sql"
BACKUP_PATH="$LOCAL_BACKUP_DIR/$BACKUP_FILE"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling
cleanup() {
    if [ -f "$BACKUP_PATH" ]; then
        log "Cleaning up local backup file: $BACKUP_PATH"
        rm -f "$BACKUP_PATH"
    fi
}

trap cleanup ERR

log "Starting FeedbackFlow database backup..."
log "Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
log "Backup file: $BACKUP_PATH"

# Check if PostgreSQL client tools are available
if ! command -v pg_dump &> /dev/null; then
    log "ERROR: pg_dump is not installed or not in PATH"
    exit 1
fi

# Check if AWS CLI is available (if S3 upload is requested)
if [ -n "$S3_BUCKET" ] && ! command -v aws &> /dev/null; then
    log "WARNING: AWS CLI is not installed. S3 upload will be skipped."
    S3_BUCKET=""
fi

# Create database backup
log "Creating database backup..."
if [ -n "$PGPASSWORD" ]; then
    # Use password from environment
    pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
        --verbose --no-password --format=custom --compress=9 \
        --file="$BACKUP_PATH" 2>&1 | while read line; do log "$line"; done
else
    # Prompt for password or use .pgpass
    pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" \
        --verbose --format=custom --compress=9 \
        --file="$BACKUP_PATH" 2>&1 | while read line; do log "$line"; done
fi

# Verify backup file was created and is not empty
if [ ! -f "$BACKUP_PATH" ]; then
    log "ERROR: Backup file was not created"
    exit 1
fi

BACKUP_SIZE=$(stat -f%z "$BACKUP_PATH" 2>/dev/null || stat -c%s "$BACKUP_PATH" 2>/dev/null || echo "0")
if [ "$BACKUP_SIZE" -eq 0 ]; then
    log "ERROR: Backup file is empty"
    exit 1
fi

log "Backup created successfully. Size: $(numfmt --to=iec $BACKUP_SIZE)"

# Upload to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    log "Uploading backup to S3: s3://$S3_BUCKET/backups/"
    
    # Add metadata to S3 object
    aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/backups/" \
        --metadata "database=$DB_NAME,timestamp=$TIMESTAMP,size=$BACKUP_SIZE" \
        --storage-class STANDARD_IA \
        2>&1 | while read line; do log "$line"; done
    
    if [ $? -eq 0 ]; then
        log "Backup uploaded to S3 successfully"
        
        # Set lifecycle policy for automated deletion
        if aws s3api head-bucket --bucket "$S3_BUCKET" &> /dev/null; then
            cat > /tmp/lifecycle.json << EOF
{
    "Rules": [
        {
            "ID": "FeedbackFlowBackupRetention",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "backups/"
            },
            "Expiration": {
                "Days": $BACKUP_RETENTION_DAYS
            },
            "Transitions": [
                {
                    "Days": 7,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 30,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ]
        }
    ]
}
EOF
            
            aws s3api put-bucket-lifecycle-configuration \
                --bucket "$S3_BUCKET" \
                --lifecycle-configuration file:///tmp/lifecycle.json
            
            log "S3 lifecycle policy updated for automated retention"
            rm -f /tmp/lifecycle.json
        fi
        
        # Clean up local backup file after successful S3 upload
        log "Removing local backup file"
        rm -f "$BACKUP_PATH"
    else
        log "ERROR: Failed to upload backup to S3"
        exit 1
    fi
else
    log "S3 upload skipped. Backup saved locally: $BACKUP_PATH"
fi

# Clean up old local backups (if S3 is not configured)
if [ -z "$S3_BUCKET" ]; then
    log "Cleaning up old local backups (older than $BACKUP_RETENTION_DAYS days)"
    find "$LOCAL_BACKUP_DIR" -name "feedbackflow_backup_*.sql" -type f -mtime +$BACKUP_RETENTION_DAYS -delete
fi

log "Backup process completed successfully"

# Optional: Send notification (uncomment and configure as needed)
# curl -X POST "$SLACK_WEBHOOK_URL" -H 'Content-type: application/json' \
#     --data "{\"text\":\"✅ FeedbackFlow backup completed: $BACKUP_FILE\"}" || true
