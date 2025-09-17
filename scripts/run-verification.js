#!/usr/bin/env node
// FeedbackFlow Deployment Verification Runner
// Runs all verification checks from the deployment checklist

const { checkDatabaseConnection, checkPrismaIndexes, checkIPAnonymization, checkDataRetention, checkDashboardQueries, checkDatabasePerformance } = require('./verify-deployment.js');
const { testMiddleware } = require('./test-middleware.js');
const { runDebugCommands } = require('./debug-performance.js');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().substring(0, 19).replace('T', ' ');
  console.log(`[${timestamp}] ${colors[color]}${message}${colors.reset}`);
}

function logTitle(title) {
  const border = '='.repeat(title.length + 4);
  console.log(`${colors.cyan}${colors.bold}`);
  console.log(border);
  console.log(`  ${title}`);
  console.log(border);
  console.log(colors.reset);
}

async function runFullVerification() {
  logTitle('🎯 FEEDBACKFLOW DEPLOYMENT VERIFICATION');
  
  console.log(`${colors.blue}Running comprehensive verification of all deployment requirements...${colors.reset}\n`);
  
  const results = {};
  let totalTests = 0;
  let passedTests = 0;
  
  try {
    // 1. Database Infrastructure Tests
    log('🏗️ INFRASTRUCTURE VERIFICATION', 'cyan');
    log('━'.repeat(50), 'cyan');
    
    const infraTests = [
      { name: 'Database Connection', fn: checkDatabaseConnection },
      { name: 'Prisma Indexes', fn: checkPrismaIndexes },
      { name: 'Database Performance', fn: checkDatabasePerformance }
    ];
    
    for (const test of infraTests) {
      totalTests++;
      log(`Testing ${test.name}...`, 'blue');
      try {
        const result = await test.fn();
        results[test.name] = result;
        if (result) {
          passedTests++;
          log(`✅ ${test.name} - PASSED`, 'green');
        } else {
          log(`❌ ${test.name} - FAILED`, 'red');
        }
      } catch (error) {
        results[test.name] = false;
        log(`❌ ${test.name} - ERROR: ${error.message}`, 'red');
      }
    }
    
    console.log('');
    
    // 2. Privacy & Compliance Tests
    log('🔒 PRIVACY & COMPLIANCE VERIFICATION', 'cyan');
    log('━'.repeat(50), 'cyan');
    
    const privacyTests = [
      { name: 'IP Anonymization', fn: checkIPAnonymization },
      { name: 'Data Retention', fn: checkDataRetention }
    ];
    
    for (const test of privacyTests) {
      totalTests++;
      log(`Testing ${test.name}...`, 'blue');
      try {
        const result = await test.fn();
        results[test.name] = result;
        if (result) {
          passedTests++;
          log(`✅ ${test.name} - PASSED`, 'green');
        } else {
          log(`❌ ${test.name} - FAILED`, 'red');
        }
      } catch (error) {
        results[test.name] = false;
        log(`❌ ${test.name} - ERROR: ${error.message}`, 'red');
      }
    }
    
    console.log('');
    
    // 3. Application Logic Tests
    log('🚀 APPLICATION VERIFICATION', 'cyan');
    log('━'.repeat(50), 'cyan');
    
    totalTests++;
    log('Testing Dashboard Queries...', 'blue');
    try {
      const dashboardResult = await checkDashboardQueries();
      results['Dashboard Queries'] = dashboardResult;
      if (dashboardResult) {
        passedTests++;
        log('✅ Dashboard Queries - PASSED', 'green');
      } else {
        log('❌ Dashboard Queries - FAILED', 'red');
      }
    } catch (error) {
      results['Dashboard Queries'] = false;
      log(`❌ Dashboard Queries - ERROR: ${error.message}`, 'red');
    }
    
    totalTests++;
    log('Testing Middleware Logic...', 'blue');
    try {
      const middlewareResult = await testMiddleware();
      results['Middleware Logic'] = middlewareResult;
      if (middlewareResult) {
        passedTests++;
        log('✅ Middleware Logic - PASSED', 'green');
      } else {
        log('❌ Middleware Logic - FAILED', 'red');
      }
    } catch (error) {
      results['Middleware Logic'] = false;
      log(`❌ Middleware Logic - ERROR: ${error.message}`, 'red');
    }
    
    console.log('');
    
    // 4. Performance & Debug Analysis
    log('⚡ PERFORMANCE ANALYSIS', 'cyan');
    log('━'.repeat(50), 'cyan');
    
    log('Running comprehensive performance analysis...', 'blue');
    try {
      await runDebugCommands();
      log('✅ Performance Analysis - COMPLETED', 'green');
    } catch (error) {
      log(`⚠️ Performance Analysis - Had issues: ${error.message}`, 'yellow');
    }
    
    console.log('');
    
    // 5. Final Summary
    logTitle('📊 VERIFICATION SUMMARY');
    
    log(`Total Verification Checks: ${totalTests}`, 'blue');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
    
    const successRate = (passedTests / totalTests * 100).toFixed(1);
    log(`Success Rate: ${successRate}%`, successRate === '100.0' ? 'green' : 'yellow');
    
    console.log('');
    log('Detailed Results:', 'blue');
    log('━'.repeat(30), 'blue');
    
    Object.entries(results).forEach(([name, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const color = passed ? 'green' : 'red';
      log(`${status} - ${name}`, color);
    });
    
    console.log('');
    
    if (passedTests === totalTests) {
      logTitle('🎉 ALL CHECKS PASSED - PRODUCTION READY!');
      
      log('🚀 Your FeedbackFlow deployment is ready for production!', 'green');
      log('✅ All database indexes are optimized', 'green');
      log('✅ IP anonymization is protecting user privacy', 'green');
      log('✅ Middleware is not blocking required routes', 'green');
      log('✅ Dashboard queries are performing excellently', 'green');
      log('✅ Data retention policies are working correctly', 'green');
      log('✅ Performance metrics show excellent optimization', 'green');
      
      console.log('');
      log('📋 Next Steps:', 'cyan');
      log('1. Set production environment variables', 'blue');
      log('2. Configure S3 bucket for backups', 'blue');
      log('3. Install scheduled tasks for automation', 'blue');
      log('4. Deploy with confidence! 🚀', 'blue');
      
    } else {
      logTitle('⚠️ SOME CHECKS FAILED');
      
      log(`${totalTests - passedTests} verification checks failed.`, 'red');
      log('Please review the failed items before deploying to production.', 'red');
      
      console.log('');
      log('Failed checks:', 'red');
      Object.entries(results).forEach(([name, passed]) => {
        if (!passed) {
          log(`❌ ${name}`, 'red');
        }
      });
    }
    
    console.log('');
    logTitle('🔍 VERIFICATION COMPLETED');
    
    return passedTests === totalTests;
    
  } catch (error) {
    log(`❌ Verification failed with error: ${error.message}`, 'red');
    return false;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runFullVerification().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error(`❌ Verification runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runFullVerification };
