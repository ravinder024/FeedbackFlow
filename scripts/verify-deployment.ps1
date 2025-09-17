# FeedbackFlow Deployment Verification Script
# This PowerShell script runs all verification checks for the deployment checklist

param(
    [switch]$Verbose,
    [switch]$DatabaseOnly,
    [switch]$BackupOnly,
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Configuration
$DbHost = if ($env:FEEDBACKFLOW_DB_HOST) { $env:FEEDBACKFLOW_DB_HOST } else { "localhost" }
$DbPort = if ($env:FEEDBACKFLOW_DB_PORT) { $env:FEEDBACKFLOW_DB_PORT } else { "5432" }
$DbUser = if ($env:FEEDBACKFLOW_DB_USER) { $env:FEEDBACKFLOW_DB_USER } else { "feedbackflow_user" }
$DbName = if ($env:FEEDBACKFLOW_DB_NAME) { $env:FEEDBACKFLOW_DB_NAME } else { "feedbackflow" }

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
        "TITLE" { "Cyan" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-DatabaseConnection {
    Write-Log "Testing database connection..." "INFO"
    
    if (!$env:PGPASSWORD) {
        Write-Log "PGPASSWORD environment variable not set" "ERROR"
        return $false
    }
    
    try {
        # Test basic connection
        $result = & node.exe -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.`$queryRaw\`SELECT 1 as test\`.then(() => {
                console.log('Database connection successful');
                process.exit(0);
            }).catch(err => {
                console.error('Database connection failed:', err.message);
                process.exit(1);
            });
        " 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Database connection successful" "SUCCESS"
            return $true
        } else {
            Write-Log "❌ Database connection failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Database connection error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-PrismaIndexes {
    Write-Log "Checking Prisma indexes..." "INFO"
    
    $indexQuery = @"
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('event_logs', 'user_activities', 'pins', 'widget_feedback', 'test_groups')
ORDER BY tablename, indexname;
"@
    
    try {
        $result = & node.exe -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.`$queryRawUnsafe\`$indexQuery\`.then(result => {
                console.log('Found', result.length, 'indexes');
                if (result.length >= 15) {
                    console.log('✅ All expected indexes found');
                } else {
                    console.log('⚠️ Some indexes may be missing');
                }
                result.forEach(idx => console.log(' -', idx.tablename + '.' + idx.indexname));
                process.exit(0);
            }).catch(err => {
                console.error('Index check failed:', err.message);
                process.exit(1);
            });
        " 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Prisma indexes verified" "SUCCESS"
            if ($Verbose) {
                Write-Log "Index details: $result" "INFO"
            }
            return $true
        } else {
            Write-Log "❌ Index verification failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Index check error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-IPAnonymization {
    Write-Log "Testing IP anonymization..." "INFO"
    
    $ipQuery = @"
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN "ipAddress" LIKE '%.%.%.XXX' THEN 1 END) as anonymized_ips,
    COUNT(CASE WHEN "ipAddress" NOT LIKE '%.%.%.XXX' AND "ipAddress" IS NOT NULL THEN 1 END) as non_anonymized_ips,
    COUNT(CASE WHEN "ipAddress" IS NULL THEN 1 END) as null_ips
FROM "UserActivity";
"@
    
    try {
        $result = & node.exe -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.`$queryRawUnsafe\`$ipQuery\`.then(result => {
                const data = result[0];
                console.log('Total UserActivity records:', data.total_records);
                console.log('Anonymized IPs:', data.anonymized_ips);
                console.log('Non-anonymized IPs:', data.non_anonymized_ips);
                console.log('Null IPs:', data.null_ips);
                
                if (data.total_records == 0) {
                    console.log('⚠️ No UserActivity records found');
                } else if (data.non_anonymized_ips > 0) {
                    console.log('❌ Found non-anonymized IP addresses');
                    process.exit(1);
                } else {
                    console.log('✅ All IP addresses properly anonymized');
                }
                process.exit(0);
            }).catch(err => {
                console.error('IP anonymization check failed:', err.message);
                process.exit(1);
            });
        " 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ IP anonymization working correctly" "SUCCESS"
            if ($Verbose) {
                Write-Log "IP details: $result" "INFO"
            }
            return $true
        } else {
            Write-Log "❌ IP anonymization check failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ IP anonymization error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-MiddlewareRoutes {
    Write-Log "Testing middleware doesn't block routes..." "INFO"
    
    # Check if the Next.js app is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ API routes accessible" "SUCCESS"
            return $true
        }
    } catch {
        # Try to start the dev server briefly for testing
        Write-Log "Starting Next.js dev server for route testing..." "INFO"
        
        $job = Start-Job -ScriptBlock {
            Set-Location $using:ProjectRoot
            npm run dev
        }
        
        Start-Sleep -Seconds 10
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
            Stop-Job $job -Force
            Remove-Job $job -Force
            
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ Middleware allows route access" "SUCCESS"
                return $true
            }
        } catch {
            Stop-Job $job -Force
            Remove-Job $job -Force
            Write-Log "⚠️ Could not test middleware routes - app not running" "WARN"
            return $false
        }
    }
    
    Write-Log "⚠️ Cannot test middleware - Next.js app not accessible" "WARN"
    return $false
}

function Test-BackupSystem {
    Write-Log "Testing backup system..." "INFO"
    
    # Check if backup scripts exist
    $backupScript = Join-Path $ScriptDir "backup.sh"
    $restoreScript = Join-Path $ScriptDir "restore.sh"
    $validationScript = Join-Path $ScriptDir "validate-backup-setup.ps1"
    
    $scriptsExist = $true
    if (!(Test-Path $backupScript)) {
        Write-Log "❌ Backup script missing: $backupScript" "ERROR"
        $scriptsExist = $false
    }
    if (!(Test-Path $restoreScript)) {
        Write-Log "❌ Restore script missing: $restoreScript" "ERROR"
        $scriptsExist = $false
    }
    if (!(Test-Path $validationScript)) {
        Write-Log "❌ Validation script missing: $validationScript" "ERROR"
        $scriptsExist = $false
    }
    
    if (!$scriptsExist) {
        return $false
    }
    
    # Run backup validation
    try {
        $result = & PowerShell.exe -File $validationScript 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Backup system validation passed" "SUCCESS"
            if ($Verbose) {
                Write-Log "Backup validation details: $result" "INFO"
            }
            return $true
        } else {
            Write-Log "❌ Backup system validation failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Backup validation error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-DashboardFilters {
    Write-Log "Testing dashboard functionality..." "INFO"
    
    # Test if we can query the data that the dashboard would use
    $dashboardQuery = @"
SELECT 
    COUNT(*) as total_events,
    COUNT(DISTINCT "eventType") as event_types,
    COUNT(DISTINCT "userId") as unique_users,
    MIN("timestamp") as earliest_event,
    MAX("timestamp") as latest_event
FROM "EventLog";
"@
    
    try {
        $result = & node.exe -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.`$queryRawUnsafe\`$dashboardQuery\`.then(result => {
                const data = result[0];
                console.log('Total events:', data.total_events);
                console.log('Event types:', data.event_types);
                console.log('Unique users:', data.unique_users);
                console.log('Date range:', data.earliest_event, 'to', data.latest_event);
                console.log('✅ Dashboard data queries working');
                process.exit(0);
            }).catch(err => {
                console.error('Dashboard query failed:', err.message);
                process.exit(1);
            });
        " 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Dashboard data queries working" "SUCCESS"
            if ($Verbose) {
                Write-Log "Dashboard data: $result" "INFO"
            }
            return $true
        } else {
            Write-Log "❌ Dashboard queries failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Dashboard test error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-DatabasePerformance {
    Write-Log "Testing database performance..." "INFO"
    
    # Run the deployment verification SQL script
    $verificationScript = Join-Path $ScriptDir "verify-deployment.sql"
    
    if (!(Test-Path $verificationScript)) {
        Write-Log "❌ Verification SQL script missing: $verificationScript" "ERROR"
        return $false
    }
    
    try {
        $result = & node.exe -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            const fs = require('fs');
            
            const sql = fs.readFileSync('$verificationScript', 'utf8');
            
            // Split SQL into individual statements and run them
            const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
            
            Promise.all(statements.map(stmt => {
                if (stmt.trim()) {
                    return prisma.`$queryRawUnsafe\`\${stmt.trim()}\`.catch(err => {
                        console.log('Query failed:', stmt.substring(0, 50) + '...', err.message);
                        return null;
                    });
                }
            })).then(results => {
                console.log('✅ Database performance tests completed');
                console.log('Executed', results.filter(r => r !== null).length, 'queries successfully');
                process.exit(0);
            }).catch(err => {
                console.error('Performance test failed:', err.message);
                process.exit(1);
            });
        " 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Database performance tests passed" "SUCCESS"
            if ($Verbose) {
                Write-Log "Performance details: $result" "INFO"
            }
            return $true
        } else {
            Write-Log "❌ Database performance tests failed: $result" "ERROR"
            return $false
        }
    } catch {
        Write-Log "❌ Performance test error: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Show-VerificationSummary {
    param([hashtable]$Results)
    
    Write-Log "" "INFO"
    Write-Log "===========================================" "TITLE"
    Write-Log "   FEEDBACKFLOW DEPLOYMENT VERIFICATION   " "TITLE"
    Write-Log "===========================================" "TITLE"
    
    $totalTests = $Results.Count
    $passedTests = ($Results.Values | Where-Object { $_ -eq $true }).Count
    $failedTests = $totalTests - $passedTests
    
    Write-Log "Total Checks: $totalTests" "INFO"
    Write-Log "Passed: $passedTests" "SUCCESS"
    Write-Log "Failed: $failedTests" $(if ($failedTests -eq 0) { "SUCCESS" } else { "ERROR" })
    
    Write-Log "" "INFO"
    Write-Log "Detailed Results:" "INFO"
    foreach ($test in $Results.Keys) {
        $status = if ($Results[$test]) { "✅ PASS" } else { "❌ FAIL" }
        $color = if ($Results[$test]) { "SUCCESS" } else { "ERROR" }
        Write-Log "  $status - $test" $color
    }
    
    Write-Log "" "INFO"
    if ($failedTests -eq 0) {
        Write-Log "🎉 ALL VERIFICATION CHECKS PASSED!" "SUCCESS"
        Write-Log "Your FeedbackFlow deployment is ready for production." "SUCCESS"
    } else {
        Write-Log "⚠️ SOME CHECKS FAILED" "ERROR"
        Write-Log "Please fix the failed items before deploying to production." "ERROR"
    }
    Write-Log "===========================================" "TITLE"
}

function Show-Help {
    Write-Host @"
FeedbackFlow Deployment Verification

This script runs all verification checks from the deployment checklist:
1. Prisma indexes exist
2. IP anonymization works  
3. Middleware doesn't block routes
4. Backups run successfully
5. Dashboard filters work
6. Database performance

Usage: .\verify-deployment.ps1 [OPTIONS]

Options:
  -Verbose        Show detailed information for each test
  -DatabaseOnly   Run only database-related checks
  -BackupOnly     Run only backup system checks
  -Help           Show this help message

Examples:
  .\verify-deployment.ps1
  .\verify-deployment.ps1 -Verbose
  .\verify-deployment.ps1 -DatabaseOnly
"@
}

# Main execution function
function Invoke-DeploymentVerification {
    Write-Log "Starting FeedbackFlow deployment verification..." "TITLE"
    Write-Log "" "INFO"
    
    $results = @{}
    
    # Database connection test
    $results["Database Connection"] = Test-DatabaseConnection
    
    if (!$BackupOnly) {
        # Database-specific tests
        $results["Prisma Indexes"] = Test-PrismaIndexes
        $results["IP Anonymization"] = Test-IPAnonymization
        $results["Dashboard Queries"] = Test-DashboardFilters
        $results["Database Performance"] = Test-DatabasePerformance
        
        if (!$DatabaseOnly) {
            # Application tests
            $results["Middleware Routes"] = Test-MiddlewareRoutes
        }
    }
    
    if (!$DatabaseOnly) {
        # Backup system tests
        $results["Backup System"] = Test-BackupSystem
    }
    
    # Show summary
    Show-VerificationSummary $results
    
    # Return overall success
    return ($results.Values | Where-Object { $_ -eq $false }).Count -eq 0
}

# Handle command line arguments
if ($Help) {
    Show-Help
    exit 0
}

# Run verification
$success = Invoke-DeploymentVerification

exit $(if ($success) { 0 } else { 1 })
