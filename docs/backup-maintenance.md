# FeedbackFlow Backup and Maintenance Documentation

## Overview

This document describes the automated backup and log rotation system for FeedbackFlow. The system includes database backups, log rotation, S3 storage management, and automated scheduling.

## Components

### Scripts

1. **backup.sh** - Weekly database backup script
   - Creates compressed PostgreSQL dumps
   - Uploads to S3 with lifecycle management
   - Handles error logging and notifications

2. **monthly-maintenance.ps1** - Monthly maintenance script (PowerShell)
   - Runs log rotation SQL script
   - Creates pre-rotation backup
   - Cleans up old S3 backups
   - Comprehensive error handling and logging

3. **log-rotation.sql** - Database cleanup script
   - Removes old event logs (1 year retention)
   - Cleans user activity data (90 days auth, 30 days anonymous)
   - Maintains cleanup statistics
   - Vacuum/analyze for performance

4. **task-scheduler-setup.ps1** - Windows Task Scheduler configuration
   - Installs/uninstalls scheduled tasks
   - Configures weekly backups and monthly maintenance
   - Administrative task management

### Configuration

#### Environment Variables

```bash
# Database Configuration
FEEDBACKFLOW_DB_NAME=feedbackflow
FEEDBACKFLOW_DB_USER=feedbackflow_user
FEEDBACKFLOW_DB_HOST=localhost
FEEDBACKFLOW_DB_PORT=5432
PGPASSWORD=your_database_password

# S3 Configuration
FEEDBACKFLOW_S3_BUCKET=feedbackflow-backups
FEEDBACKFLOW_S3_PREFIX=backups
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=us-east-1
```

#### S3 Bucket Policy

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT:user/feedbackflow-backup"
            },
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::feedbackflow-backups",
                "arn:aws:s3:::feedbackflow-backups/*"
            ]
        }
    ]
}
```

#### S3 Lifecycle Policy

```json
{
    "Rules": [
        {
            "ID": "FeedbackFlowBackupLifecycle",
            "Status": "Enabled",
            "Filter": {
                "Prefix": "backups/"
            },
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                },
                {
                    "Days": 365,
                    "StorageClass": "DEEP_ARCHIVE"
                }
            ],
            "Expiration": {
                "Days": 2555
            }
        }
    ]
}
```

## Setup Instructions

### 1. Prerequisites

Install required dependencies:

```powershell
# PostgreSQL Client Tools
# Download from: https://www.postgresql.org/download/windows/

# AWS CLI
# Download from: https://aws.amazon.com/cli/
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Git Bash (for bash scripts on Windows)
# Download from: https://git-scm.com/download/win
```

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
# Copy from .env.example and configure for your environment
cp .env.example .env
```

Edit the `.env` file with your database and AWS credentials.

### 3. AWS S3 Setup

Create S3 bucket and configure lifecycle:

```bash
# Create bucket
aws s3 mb s3://feedbackflow-backups

# Apply lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
  --bucket feedbackflow-backups \
  --lifecycle-configuration file://s3-lifecycle-policy.json

# Apply bucket policy
aws s3api put-bucket-policy \
  --bucket feedbackflow-backups \
  --policy file://s3-bucket-policy.json
```

### 4. Install Scheduled Tasks

Run as Administrator:

```powershell
# Install scheduled tasks
.\scripts\task-scheduler-setup.ps1 -Install

# Check status
.\scripts\task-scheduler-setup.ps1 -Status
```

### 5. Test Scripts

Test each component:

```powershell
# Test backup script
bash .\scripts\backup.sh

# Test log rotation (dry run first)
.\scripts\monthly-maintenance.ps1 -DryRun

# Test log rotation only
.\scripts\monthly-maintenance.ps1 -RotationOnly
```

## Monitoring and Maintenance

### Log Files

- Backup logs: `/var/log/feedbackflow/backup.log` (Linux) or `C:\Logs\FeedbackFlow\backup.log` (Windows)
- Maintenance logs: `/var/log/feedbackflow/maintenance.log` (Linux) or `C:\Logs\FeedbackFlow\maintenance.log` (Windows)

### Monitoring Commands

```powershell
# Check task status
.\scripts\task-scheduler-setup.ps1 -Status

# View recent logs
Get-Content C:\Logs\FeedbackFlow\maintenance.log -Tail 50

# Check S3 backups
aws s3 ls s3://feedbackflow-backups/backups/ --recursive --human-readable

# Test database connection
psql -h localhost -U feedbackflow_user -d feedbackflow -c "SELECT COUNT(*) FROM \"EventLog\";"
```

### Backup Verification

Verify backups are working:

```bash
# List recent backups
aws s3 ls s3://feedbackflow-backups/backups/ --recursive | tail -10

# Download and test restore (on test environment)
bash ./scripts/restore.sh --list-s3
bash ./scripts/restore.sh --from-s3 backup_filename.sql.gz
```

## Data Retention Policies

### Event Logs
- **Retention**: 365 days
- **Cleanup**: Monthly on 1st Sunday
- **Backup**: Before each cleanup

### User Activity
- **Authenticated Users**: 90 days
- **Anonymous Users**: 30 days
- **Cleanup**: Monthly on 1st Sunday

### Backups
- **Local**: Deleted after S3 upload
- **S3 Standard**: 30 days
- **S3 Standard-IA**: 30-90 days
- **S3 Glacier**: 90-365 days
- **S3 Deep Archive**: 365+ days
- **Expiration**: 7 years (2555 days)

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Solution: Check PGPASSWORD environment variable and database credentials
   ```

2. **S3 Upload Failed**
   ```
   Solution: Verify AWS credentials and S3 bucket permissions
   ```

3. **Scheduled Task Not Running**
   ```
   Solution: Check Task Scheduler, ensure scripts are executable, verify paths
   ```

4. **Log Rotation Errors**
   ```
   Solution: Check database locks, verify table permissions, review SQL syntax
   ```

### Debug Commands

```powershell
# Test database connection
$env:PGPASSWORD = "your_password"
psql -h localhost -U feedbackflow_user -d feedbackflow -c "SELECT version();"

# Test AWS CLI
aws sts get-caller-identity

# Test S3 access
aws s3 ls s3://feedbackflow-backups/

# Run maintenance in debug mode
.\scripts\monthly-maintenance.ps1 -DryRun
```

## Security Considerations

1. **Database Credentials**: Store in environment variables, not in scripts
2. **AWS Credentials**: Use IAM roles when possible, least privilege principle
3. **Backup Encryption**: Enable S3 server-side encryption
4. **Log Files**: Ensure proper permissions on log directories
5. **Script Permissions**: Restrict execution to authorized users only

## Performance Impact

- **Log Rotation**: Runs during low-traffic hours (3:00 AM)
- **Backups**: Minimal impact, non-blocking operations
- **Vacuum Operations**: Brief table locks during cleanup
- **S3 Uploads**: Compressed files reduce bandwidth usage

## Disaster Recovery

### Full Database Restore

```bash
# Stop application
# Restore from most recent backup
bash ./scripts/restore.sh --from-s3 latest_backup.sql.gz --drop-existing

# Restart application
# Verify data integrity
```

### Partial Data Recovery

```sql
-- Restore specific tables from backup
-- Use point-in-time recovery if available
-- Apply transaction logs if needed
```
