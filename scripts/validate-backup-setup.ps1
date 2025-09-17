# FeedbackFlow Backup System Validation Script
# This script validates that all backup and maintenance components are properly configured

param(
    [switch]$Verbose,
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-FileExists {
    param(
        [string]$FilePath,
        [string]$Description
    )
    
    if (Test-Path $FilePath) {
        Write-Log "$Description - Found" "SUCCESS"
        return $true
    } else {
        Write-Log "$Description - Missing: $FilePath" "ERROR"
        return $false
    }
}

function Test-Command {
    param(
        [string]$Command,
        [string]$Description
    )
    
    if (Get-Command $Command -ErrorAction SilentlyContinue) {
        Write-Log "$Description - Available" "SUCCESS"
        return $true
    } else {
        Write-Log "$Description - Not found: $Command" "ERROR"
        return $false
    }
}

function Test-EnvironmentVariable {
    param(
        [string]$VarName,
        [string]$Description,
        [switch]$Optional
    )
    
    $value = [Environment]::GetEnvironmentVariable($VarName)
    if ($value) {
        if ($Verbose) {
            Write-Log "$Description - Set (${VarName})" "SUCCESS"
        } else {
            Write-Log "$Description - Set" "SUCCESS"
        }
        return $true
    } else {
        $level = if ($Optional) { "WARN" } else { "ERROR" }
        Write-Log "$Description - Not set: $VarName" $level
        return !$Optional
    }
}

function Test-DatabaseConnection {
    Write-Log "Testing database connection..." "INFO"
    
    $dbHost = if ($env:FEEDBACKFLOW_DB_HOST) { $env:FEEDBACKFLOW_DB_HOST } else { "localhost" }
    $dbPort = if ($env:FEEDBACKFLOW_DB_PORT) { $env:FEEDBACKFLOW_DB_PORT } else { "5432" }
    $dbUser = if ($env:FEEDBACKFLOW_DB_USER) { $env:FEEDBACKFLOW_DB_USER } else { "feedbackflow_user" }
    $dbName = if ($env:FEEDBACKFLOW_DB_NAME) { $env:FEEDBACKFLOW_DB_NAME } else { "feedbackflow" }
    
    if (!$env:PGPASSWORD) {
        Write-Log "Cannot test database connection - PGPASSWORD not set" "WARN"
        return $false
    }
    
    try {
        $result = & psql.exe -h $dbHost -p $dbPort -U $dbUser -d $dbName -c "SELECT COUNT(*) FROM \"EventLog\";" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database connection successful" "SUCCESS"
            if ($Verbose) {
                Write-Log "Event log count: $result" "INFO"
            }
            return $true
        } else {
            Write-Log "Database connection failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Database connection error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-S3Access {
    Write-Log "Testing S3 access..." "INFO"
    
    $bucket = if ($env:FEEDBACKFLOW_S3_BUCKET) { $env:FEEDBACKFLOW_S3_BUCKET } else { "feedbackflow-backups" }
    
    try {
        $result = & aws.exe s3 ls "s3://$bucket/" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "S3 access successful" "SUCCESS"
            if ($Verbose) {
                Write-Log "S3 bucket contents: $result" "INFO"
            }
            return $true
        } else {
            Write-Log "S3 access failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "S3 access error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-ScheduledTasks {
    Write-Log "Checking scheduled tasks..." "INFO"
    
    $tasks = @("FeedbackFlow-WeeklyBackup", "FeedbackFlow-MonthlyMaintenance")
    $allTasksOk = $true
    
    foreach ($taskName in $tasks) {
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        
        if ($task) {
            $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
            Write-Log "Task '$taskName' - Status: $($task.State)" "SUCCESS"
            
            if ($Verbose) {
                Write-Log "  Last Run: $($taskInfo.LastRunTime)" "INFO"
                Write-Log "  Next Run: $($taskInfo.NextRunTime)" "INFO"
                Write-Log "  Last Result: $($taskInfo.LastTaskResult)" "INFO"
            }
        } else {
            Write-Log "Task '$taskName' - Not installed" "WARN"
            $allTasksOk = $false
        }
    }
    
    return $allTasksOk
}

function Show-ValidationSummary {
    param([hashtable]$Results)
    
    Write-Log "" "INFO"
    Write-Log "=== VALIDATION SUMMARY ===" "INFO"
    
    $totalTests = $Results.Count
    $passedTests = ($Results.Values | Where-Object { $_ -eq $true }).Count
    $failedTests = $totalTests - $passedTests
    
    Write-Log "Total Tests: $totalTests" "INFO"
    Write-Log "Passed: $passedTests" "SUCCESS"
    Write-Log "Failed: $failedTests" $(if ($failedTests -eq 0) { "SUCCESS" } else { "ERROR" })
    
    if ($failedTests -gt 0) {
        Write-Log "" "INFO"
        Write-Log "Failed tests:" "ERROR"
        foreach ($test in $Results.Keys) {
            if (!$Results[$test]) {
                Write-Log "  - $test" "ERROR"
            }
        }
    }
    
    Write-Log "" "INFO"
    if ($failedTests -eq 0) {
        Write-Log "✅ All validations passed! Backup system is ready." "SUCCESS"
    } else {
        Write-Log "❌ Some validations failed. Please fix the issues before proceeding." "ERROR"
    }
}

function Show-Help {
    Write-Host @"
FeedbackFlow Backup System Validation

This script validates that all backup and maintenance components are properly configured.

Usage: .\validate-backup-setup.ps1 [OPTIONS]

Options:
  -Verbose    Show detailed information for each test
  -Help       Show this help message

What this script checks:
  ✓ Required script files exist
  ✓ Dependencies are installed (psql, pg_dump, aws)
  ✓ Environment variables are set
  ✓ Database connection works
  ✓ S3 access is configured
  ✓ Scheduled tasks are installed

Examples:
  .\validate-backup-setup.ps1
  .\validate-backup-setup.ps1 -Verbose
"@
}

# Main validation function
function Invoke-ValidationTests {
    Write-Log "Starting FeedbackFlow backup system validation..." "INFO"
    Write-Log "" "INFO"
    
    $results = @{}
    
    # Test script files
    Write-Log "=== CHECKING SCRIPT FILES ===" "INFO"
    $results["Backup Script"] = Test-FileExists "$ScriptDir\backup.sh" "Backup script"
    $results["Restore Script"] = Test-FileExists "$ScriptDir\restore.sh" "Restore script"
    $results["Log Rotation Script"] = Test-FileExists "$ScriptDir\log-rotation.sql" "Log rotation SQL"
    $results["Monthly Maintenance Script"] = Test-FileExists "$ScriptDir\monthly-maintenance.ps1" "Monthly maintenance PowerShell"
    $results["Task Scheduler Setup"] = Test-FileExists "$ScriptDir\task-scheduler-setup.ps1" "Task scheduler setup"
    
    Write-Log "" "INFO"
    
    # Test dependencies
    Write-Log "=== CHECKING DEPENDENCIES ===" "INFO"
    $results["PostgreSQL Client"] = Test-Command "psql.exe" "PostgreSQL client (psql)"
    $results["PostgreSQL Dump"] = Test-Command "pg_dump.exe" "PostgreSQL dump utility"
    $results["AWS CLI"] = Test-Command "aws.exe" "AWS CLI"
    $results["Bash"] = Test-Command "bash.exe" "Bash shell"
    
    Write-Log "" "INFO"
    
    # Test environment variables
    Write-Log "=== CHECKING ENVIRONMENT VARIABLES ===" "INFO"
    $results["Database Password"] = Test-EnvironmentVariable "PGPASSWORD" "Database password"
    $results["AWS Access Key"] = Test-EnvironmentVariable "AWS_ACCESS_KEY_ID" "AWS access key"
    $results["AWS Secret Key"] = Test-EnvironmentVariable "AWS_SECRET_ACCESS_KEY" "AWS secret key"
    Test-EnvironmentVariable "FEEDBACKFLOW_DB_NAME" "Database name" -Optional
    Test-EnvironmentVariable "FEEDBACKFLOW_DB_USER" "Database user" -Optional
    Test-EnvironmentVariable "FEEDBACKFLOW_S3_BUCKET" "S3 bucket name" -Optional
    
    Write-Log "" "INFO"
    
    # Test database connection
    Write-Log "=== TESTING DATABASE CONNECTION ===" "INFO"
    $results["Database Connection"] = Test-DatabaseConnection
    
    Write-Log "" "INFO"
    
    # Test S3 access
    Write-Log "=== TESTING S3 ACCESS ===" "INFO"
    $results["S3 Access"] = Test-S3Access
    
    Write-Log "" "INFO"
    
    # Test scheduled tasks
    Write-Log "=== CHECKING SCHEDULED TASKS ===" "INFO"
    $results["Scheduled Tasks"] = Test-ScheduledTasks
    
    # Show summary
    Show-ValidationSummary $results
    
    # Return overall success
    return ($results.Values | Where-Object { $_ -eq $false }).Count -eq 0
}

# Handle command line arguments
if ($Help) {
    Show-Help
    exit 0
}

# Run validation
$success = Invoke-ValidationTests

exit $(if ($success) { 0 } else { 1 })
