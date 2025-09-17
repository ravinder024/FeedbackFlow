#!/usr/bin/env node

/**
 * Database Backup and Restore Utility
 * 
 * This script provides functionality to backup and restore the PostgreSQL database
 * before running potentially destructive migrations.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// Parse database URL
const dbUrl = new URL(DATABASE_URL);
const dbName = dbUrl.pathname.slice(1);
const dbHost = dbUrl.hostname;
const dbPort = dbUrl.port || 5432;
const dbUser = dbUrl.username;
const dbPassword = dbUrl.password;

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

function executeCommand(command, env = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error;
  }
}

function backup() {
  const timestamp = getTimestamp();
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);
  
  console.log('🔄 Creating database backup...');
  console.log(`📁 Backup location: ${backupFile}`);
  
  const command = `pg_dump "${DATABASE_URL}" > "${backupFile}"`;
  
  try {
    executeCommand(command, {
      PGPASSWORD: dbPassword
    });
    
    console.log('✅ Database backup created successfully!');
    console.log(`📄 Backup file: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    throw error;
  }
}

function restore(backupFile) {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup file not found: ${backupFile}`);
  }
  
  console.log('🔄 Restoring database from backup...');
  console.log(`📁 Backup file: ${backupFile}`);
  
  // Drop and recreate database
  const dropCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "DROP DATABASE IF EXISTS \\"${dbName}\\""`;
  const createCommand = `psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d postgres -c "CREATE DATABASE \\"${dbName}\\""`;
  const restoreCommand = `psql "${DATABASE_URL}" < "${backupFile}"`;
  
  try {
    console.log('🗑️  Dropping existing database...');
    executeCommand(dropCommand, { PGPASSWORD: dbPassword });
    
    console.log('🆕 Creating new database...');
    executeCommand(createCommand, { PGPASSWORD: dbPassword });
    
    console.log('📥 Restoring data from backup...');
    executeCommand(restoreCommand, { PGPASSWORD: dbPassword });
    
    console.log('✅ Database restored successfully!');
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    throw error;
  }
}

function listBackups() {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (backups.length === 0) {
    console.log('📭 No backups found');
    return [];
  }
  
  console.log('📋 Available backups:');
  backups.forEach((backup, index) => {
    const filePath = path.join(BACKUP_DIR, backup);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`  ${index + 1}. ${backup} (${size} MB) - ${stats.mtime.toLocaleString()}`);
  });
  
  return backups.map(backup => path.join(BACKUP_DIR, backup));
}

function cleanupOldBackups(keepCount = 5) {
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  if (backups.length <= keepCount) {
    console.log(`📁 Keeping all ${backups.length} backups (within limit of ${keepCount})`);
    return;
  }
  
  const toDelete = backups.slice(0, backups.length - keepCount);
  console.log(`🗑️  Cleaning up ${toDelete.length} old backups...`);
  
  toDelete.forEach(backup => {
    const filePath = path.join(BACKUP_DIR, backup);
    fs.unlinkSync(filePath);
    console.log(`   Deleted: ${backup}`);
  });
  
  console.log('✅ Cleanup completed!');
}

// CLI Interface
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'backup':
    backup();
    cleanupOldBackups();
    break;
    
  case 'restore':
    if (!arg) {
      console.log('Usage: node db-backup.js restore <backup-file>');
      console.log('Available backups:');
      listBackups();
      process.exit(1);
    }
    restore(arg);
    break;
    
  case 'list':
    listBackups();
    break;
    
  case 'cleanup':
    const keepCount = parseInt(arg) || 5;
    cleanupOldBackups(keepCount);
    break;
    
  default:
    console.log('Database Backup and Restore Utility');
    console.log('');
    console.log('Usage:');
    console.log('  node db-backup.js backup           - Create a database backup');
    console.log('  node db-backup.js restore <file>   - Restore from backup file');
    console.log('  node db-backup.js list             - List available backups');
    console.log('  node db-backup.js cleanup [count]  - Cleanup old backups (keep last 5)');
    console.log('');
    console.log('Examples:');
    console.log('  node db-backup.js backup');
    console.log('  node db-backup.js restore backups/backup-2025-01-15T10-30-00.sql');
    console.log('  node db-backup.js cleanup 3');
    process.exit(1);
}
