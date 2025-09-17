#!/usr/bin/env node

/**
 * Safe Migration Runner
 * 
 * This script handles database migrations with automatic backup and rollback capabilities
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const backupScript = path.join(__dirname, 'db-backup.js');

function executeCommand(command, options = {}) {
  try {
    console.log(`🔄 Executing: ${command}`);
    return execSync(command, { 
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error;
  }
}

function createBackup() {
  console.log('📋 Creating pre-migration backup...');
  try {
    executeCommand(`node "${backupScript}" backup`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create backup:', error.message);
    return false;
  }
}

function runMigration(force = false) {
  console.log('🚀 Running Prisma migration...');
  
  try {
    if (force) {
      console.log('⚠️  Running migration with --force-reset');
      executeCommand('npx prisma migrate reset --force');
    } else {
      console.log('📝 Generating migration...');
      executeCommand('npx prisma migrate dev --name add_event_user_monitoring');
    }
    
    console.log('🔄 Generating Prisma client...');
    executeCommand('npx prisma generate');
    
    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

function checkMigrationStatus() {
  console.log('🔍 Checking migration status...');
  try {
    executeCommand('npx prisma migrate status');
    return true;
  } catch (error) {
    console.log('⚠️  Migration status check failed - database might need reset');
    return false;
  }
}

async function safeMigrate(options = {}) {
  const { force = false, skipBackup = false } = options;
  
  console.log('🛡️  Starting safe migration process...');
  console.log('=======================================');
  
  // Step 1: Create backup (unless skipped)
  if (!skipBackup) {
    const backupSuccess = createBackup();
    if (!backupSuccess) {
      console.log('❌ Backup failed. Migration aborted for safety.');
      console.log('💡 Use --skip-backup to proceed without backup (not recommended)');
      process.exit(1);
    }
  } else {
    console.log('⚠️  Skipping backup as requested');
  }
  
  // Step 2: Check current migration status
  const statusOk = checkMigrationStatus();
  
  // Step 3: Run migration
  const migrationSuccess = runMigration(force || !statusOk);
  
  if (migrationSuccess) {
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('✅ Database schema updated');
    console.log('✅ Prisma client regenerated');
    console.log('');
    console.log('💡 If you encounter issues, you can restore from backup:');
    console.log('   node scripts/db-backup.js list');
    console.log('   node scripts/db-backup.js restore <backup-file>');
  } else {
    console.log('');
    console.log('❌ Migration failed!');
    console.log('');
    console.log('🔧 Recovery options:');
    console.log('1. Check the error messages above');
    console.log('2. Restore from backup:');
    console.log('   node scripts/db-backup.js list');
    console.log('   node scripts/db-backup.js restore <backup-file>');
    console.log('3. Try force reset (DESTRUCTIVE):');
    console.log('   node scripts/safe-migrate.js --force');
    process.exit(1);
  }
}

// CLI Interface
const args = process.argv.slice(2);
const options = {
  force: args.includes('--force'),
  skipBackup: args.includes('--skip-backup')
};

if (args.includes('--help') || args.includes('-h')) {
  console.log('Safe Migration Runner');
  console.log('');
  console.log('Usage: node safe-migrate.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --force        Force reset database (destructive)');
  console.log('  --skip-backup  Skip creating backup (not recommended)');
  console.log('  --help, -h     Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/safe-migrate.js           # Safe migration with backup');
  console.log('  node scripts/safe-migrate.js --force   # Force reset with backup');
  process.exit(0);
}

safeMigrate(options);
