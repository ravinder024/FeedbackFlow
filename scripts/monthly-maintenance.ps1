# FeedbackFlow Log Rotation and Backup Automation Script (PowerShell)
# This script handles database cleanup and automated backups on Windows

param(
    [switch]$DryRun,
    [switch]$RotationOnly,
    [switch]$BackupOnly,
    [switch]$Help
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogFile = "C:\Logs\FeedbackFlow\maintenance.log"
$LockFile = "$env:TEMP\feedbackflow-maintenance.lock"

# Database configuration (from environment or defaults)
$DbName = if ($env:FEEDBACKFLOW_DB_NAME) { $env:FEEDBACKFLOW_DB_NAME } else { "feedbackflow" }
$DbUser = if ($env:FEEDBACKFLOW_DB_USER) { $env:FEEDBACKFLOW_DB_USER } else { "feedbackflow_user" }
$DbHost = if ($env:FEEDBACKFLOW_DB_HOST) { $env:FEEDBACKFLOW_DB_HOST } else { "localhost" }
$DbPort = if ($env:FEEDBACKFLOW_DB_PORT) { $env:FEEDBACKFLOW_DB_PORT } else { "5432" }

# S3 configuration
$S3Bucket = if ($env:FEEDBACKFLOW_S3_BUCKET) { $env:FEEDBACKFLOW_S3_BUCKET } else { "feedbackflow-backups" }
$S3Prefix = if ($env:FEEDBACKFLOW_S3_PREFIX) { $env:FEEDBACKFLOW_S3_PREFIX } else { "logs" }

# Retention settings
$BackupRetentionDays = 90
$LogRetentionDays = 365

# Create log directory if it doesn't exist
$LogDir = Split-Path -Parent $LogFile
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

# Error handling
function Handle-Error {
    param([string]$ErrorMessage)
    Write-Log "ERROR: $ErrorMessage"
    Cleanup
    exit 1
}

# Cleanup function
function Cleanup {
    if (Test-Path $LockFile) {
        Remove-Item $LockFile -Force
    }
}

# Register cleanup for script exit
Register-EngineEvent PowerShell.Exiting -Action { Cleanup }

# Check if script is already running
if (Test-Path $LockFile) {
    $lockPid = Get-Content $LockFile -ErrorAction SilentlyContinue
    if ($lockPid -and (Get-Process -Id $lockPid -ErrorAction SilentlyContinue)) {
        Write-Log "Maintenance script is already running (PID: $lockPid)"
        exit 1
    } else {
        Write-Log "Removing stale lock file"
        Remove-Item $LockFile -Force
    }
}

# Create lock file
$PID | Out-File $LockFile

Write-Log "Starting FeedbackFlow maintenance script"

# Check dependencies
function Test-Dependencies {
    $missingDeps = @()
    
    if (!(Get-Command psql.exe -ErrorAction SilentlyContinue)) {
        $missingDeps += "psql"
    }
    if (!(Get-Command pg_dump.exe -ErrorAction SilentlyContinue)) {
        $missingDeps += "pg_dump"
    }
    if (!(Get-Command aws.exe -ErrorAction SilentlyContinue)) {
        $missingDeps += "aws"
    }
    
    if ($missingDeps.Count -gt 0) {
        Handle-Error "Missing dependencies: $($missingDeps -join ', ')"
    }
}

# Test database connection
function Test-DatabaseConnection {
    Write-Log "Testing database connection..."
    
    $env:PGPASSWORD = $env:PGPASSWORD
    $result = & psql.exe -h $DbHost -p $DbPort -U $DbUser -d $DbName -c "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Handle-Error "Cannot connect to database: $result"
    }
    Write-Log "Database connection successful"
}

# Run log rotation
function Invoke-LogRotation {
    Write-Log "Starting log rotation..."
    
    $rotationScript = Join-Path $ScriptDir "log-rotation.sql"
    if (!(Test-Path $rotationScript)) {
        Handle-Error "Log rotation script not found: $rotationScript"
    }
    
    $env:PGPASSWORD = $env:PGPASSWORD
    $result = & psql.exe -h $DbHost -p $DbPort -U $DbUser -d $DbName -f $rotationScript 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Log rotation completed successfully"
        Add-Content -Path $LogFile -Value $result
    } else {
        Handle-Error "Log rotation failed: $result"
    }
}

# Create backup before log rotation
function New-Backup {
    Write-Log "Creating database backup before log rotation..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "feedbackflow_pre_rotation_$timestamp.sql"
    $backupPath = Join-Path $env:TEMP $backupFile
    
    $env:PGPASSWORD = $env:PGPASSWORD
    & pg_dump.exe -h $DbHost -p $DbPort -U $DbUser -d $DbName | Out-File $backupPath -Encoding UTF8
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Backup created: $backupPath"
        
        # Compress backup
        $compressedPath = "$backupPath.gz"
        if (Get-Command gzip.exe -ErrorAction SilentlyContinue) {
            & gzip.exe $backupPath
            $backupPath = $compressedPath
            Write-Log "Backup compressed: $backupPath"
        }
        
        # Upload to S3
        if (Send-ToS3 $backupPath "$S3Prefix/pre-rotation/") {
            Write-Log "Backup uploaded to S3"
            Remove-Item $backupPath -Force
        } else {
            Write-Log "WARNING: Failed to upload backup to S3, keeping local copy"
        }
    } else {
        Handle-Error "Failed to create backup"
    }
}

# Upload file to S3
function Send-ToS3 {
    param(
        [string]$FilePath,
        [string]$S3Prefix
    )
    
    $fileName = Split-Path -Leaf $FilePath
    $s3Uri = "s3://$S3Bucket/$S3Prefix$fileName"
    
    $result = & aws.exe s3 cp $FilePath $s3Uri 2>&1
    return $LASTEXITCODE -eq 0
}

# Clean up old backups from S3
function Remove-OldBackups {
    Write-Log "Cleaning up old backups from S3..."
    
    $cutoffDate = (Get-Date).AddDays(-$BackupRetentionDays).ToString("yyyy-MM-dd")
    
    # List and delete old backups
    $oldBackups = & aws.exe s3api list-objects-v2 --bucket $S3Bucket --prefix "$S3Prefix/" --query "Contents[?LastModified<='$cutoffDate'].{Key: Key}" --output text
    
    if ($oldBackups -and $oldBackups -ne "None") {
        $oldBackups -split "`n" | ForEach-Object {
            $key = $_.Trim()
            if ($key -and $key -ne "None") {
                $result = & aws.exe s3 rm "s3://$S3Bucket/$key" 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "Deleted old backup: $key"
                } else {
                    Write-Log "WARNING: Failed to delete backup: $key"
                }
            }
        }
    }
}

# Send notification (placeholder for future email/slack integration)
function Send-Notification {
    param(
        [string]$Status,
        [string]$Message
    )
    
    # For now, just log the notification
    Write-Log "NOTIFICATION [$Status]: $Message"
    
    # Future: Implement email/Slack notifications
    # Invoke-RestMethod -Uri $SlackWebhookUrl -Method Post -Body (@{text="FeedbackFlow Maintenance [$Status]: $Message"} | ConvertTo-Json) -ContentType 'application/json'
}

# Main execution
function Invoke-MaintenanceScript {
    Write-Log "=== FeedbackFlow Monthly Maintenance Started ==="
    
    # Check dependencies
    Test-Dependencies
    
    # Test database connection
    Test-DatabaseConnection
    
    # Create backup before rotation
    New-Backup
    
    # Run log rotation
    Invoke-LogRotation
    
    # Clean up old backups
    Remove-OldBackups
    
    # Run weekly backup script for good measure
    $backupScript = Join-Path $ScriptDir "backup.sh"
    if (Test-Path $backupScript) {
        Write-Log "Running weekly backup script..."
        & bash.exe $backupScript
    }
    
    Write-Log "=== FeedbackFlow Monthly Maintenance Completed ==="
    
    Send-Notification "SUCCESS" "Monthly maintenance completed successfully"
}

# Handle command line arguments
if ($Help) {
    Write-Host @"
Usage: .\monthly-maintenance.ps1 [OPTIONS]
Options:
  -DryRun         Show what would be done without executing
  -RotationOnly   Run only log rotation
  -BackupOnly     Run only backup creation
  -Help           Show this help message
"@
    exit 0
}

if ($DryRun) {
    Write-Log "DRY RUN MODE: Would perform log rotation and backup"
    exit 0
}

if ($RotationOnly) {
    Write-Log "Running log rotation only..."
    Test-Dependencies
    Test-DatabaseConnection
    Invoke-LogRotation
    exit 0
}

if ($BackupOnly) {
    Write-Log "Running backup only..."
    Test-Dependencies
    Test-DatabaseConnection
    New-Backup
    exit 0
}

# No specific flags, run full maintenance
Invoke-MaintenanceScript
