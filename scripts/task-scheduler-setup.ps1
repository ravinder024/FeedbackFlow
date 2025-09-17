# FeedbackFlow Task Scheduler Setup Script
# This script creates Windows Task Scheduler tasks for automated backups and maintenance

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Status,
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Task definitions
$Tasks = @{
    "FeedbackFlow-WeeklyBackup" = @{
        Description = "FeedbackFlow Weekly Database Backup"
        Script = "$ScriptDir\backup.sh"
        Schedule = "Weekly"
        StartTime = "02:00"
        DaysOfWeek = "Sunday"
        RunAsSystem = $true
    }
    "FeedbackFlow-MonthlyMaintenance" = @{
        Description = "FeedbackFlow Monthly Log Rotation and Maintenance"
        Script = "$ScriptDir\monthly-maintenance.ps1"
        Schedule = "Monthly"
        StartTime = "03:00"
        DayOfMonth = "1"
        RunAsSystem = $true
    }
}

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

function Test-AdminRights {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-ScheduledTasks {
    if (!(Test-AdminRights)) {
        Write-Error "Administrator rights required to install scheduled tasks"
        exit 1
    }
    
    Write-Log "Installing FeedbackFlow scheduled tasks..."
    
    foreach ($taskName in $Tasks.Keys) {
        $task = $Tasks[$taskName]
        
        Write-Log "Creating task: $taskName"
        
        # Create task action
        if ($task.Script.EndsWith(".ps1")) {
            $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$($task.Script)`""
        } else {
            $action = New-ScheduledTaskAction -Execute "bash.exe" -Argument "`"$($task.Script)`""
        }
        
        # Create task trigger based on schedule type
        switch ($task.Schedule) {
            "Weekly" {
                $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $task.DaysOfWeek -At $task.StartTime
            }
            "Monthly" {
                # For monthly, we'll use a weekly trigger and add logic in the script to only run on the first of the month
                $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek "Sunday" -At $task.StartTime
            }
        }
        
        # Create task principal (run as SYSTEM or current user)
        if ($task.RunAsSystem) {
            $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        } else {
            $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
        }
        
        # Create task settings
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable
        
        # Register the task
        try {
            Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $task.Description -Force
            Write-Log "Task '$taskName' installed successfully"
        } catch {
            Write-Error "Failed to install task '$taskName': $($_.Exception.Message)"
        }
    }
    
    Write-Log "Scheduled tasks installation completed"
}

function Uninstall-ScheduledTasks {
    if (!(Test-AdminRights)) {
        Write-Error "Administrator rights required to uninstall scheduled tasks"
        exit 1
    }
    
    Write-Log "Uninstalling FeedbackFlow scheduled tasks..."
    
    foreach ($taskName in $Tasks.Keys) {
        try {
            if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
                Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
                Write-Log "Task '$taskName' uninstalled successfully"
            } else {
                Write-Log "Task '$taskName' not found, skipping"
            }
        } catch {
            Write-Error "Failed to uninstall task '$taskName': $($_.Exception.Message)"
        }
    }
    
    Write-Log "Scheduled tasks uninstallation completed"
}

function Get-TaskStatus {
    Write-Log "FeedbackFlow Scheduled Tasks Status:"
    Write-Log "=" * 50
    
    foreach ($taskName in $Tasks.Keys) {
        $task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        
        if ($task) {
            $taskInfo = Get-ScheduledTaskInfo -TaskName $taskName
            $nextRun = $taskInfo.NextRunTime
            $lastRun = $taskInfo.LastRunTime
            $lastResult = $taskInfo.LastTaskResult
            
            Write-Log "Task: $taskName"
            Write-Log "  Status: $($task.State)"
            Write-Log "  Last Run: $lastRun"
            Write-Log "  Last Result: $lastResult"
            Write-Log "  Next Run: $nextRun"
            Write-Log "  Description: $($task.Description)"
            Write-Log ""
        } else {
            Write-Log "Task: $taskName - NOT INSTALLED"
            Write-Log ""
        }
    }
}

function Show-Help {
    Write-Host @"
FeedbackFlow Task Scheduler Setup

Usage: .\task-scheduler-setup.ps1 [OPTIONS]

Options:
  -Install     Install scheduled tasks for FeedbackFlow automation
  -Uninstall   Remove all FeedbackFlow scheduled tasks
  -Status      Show status of all FeedbackFlow scheduled tasks
  -Help        Show this help message

Tasks that will be created:
  - FeedbackFlow-WeeklyBackup: Weekly database backup (Sundays at 2:00 AM)
  - FeedbackFlow-MonthlyMaintenance: Monthly log rotation (1st Sunday at 3:00 AM)

Note: Administrator rights are required for installation and uninstallation.

Examples:
  .\task-scheduler-setup.ps1 -Install
  .\task-scheduler-setup.ps1 -Status
  .\task-scheduler-setup.ps1 -Uninstall
"@
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

if ($Install) {
    Install-ScheduledTasks
    exit 0
}

if ($Uninstall) {
    Uninstall-ScheduledTasks
    exit 0
}

if ($Status) {
    Get-TaskStatus
    exit 0
}

# No flags provided, show help
Show-Help
