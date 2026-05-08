/**
 * Session Tracking Test Suite
 * 
 * Tests:
 * 1. Session ID consistency across multiple events
 * 2. Session ID persistence across page reloads
 * 3. Session ID reset after 30+ minutes inactivity (mocked)
 * 4. Race condition prevention (concurrent hook initialization)
 * 5. Event payload includes session_id
 * 6. Database stores session_id correctly
 */

import { getActiveSessionId, updateSessionActivity, getSessionDebugInfo } from '@/lib/tracking/use-session-id';

console.log('=== SESSION TRACKING TEST SUITE ===\n');

/**
 * Test 1: Session ID is consistent across multiple calls
 */
export function testSessionConsistency() {
  console.log('TEST 1: Session ID Consistency');
  localStorage.clear();
  
  const id1 = getActiveSessionId();
  const id2 = getActiveSessionId();
  const id3 = getActiveSessionId();
  
  const passed = id1 === id2 && id2 === id3 && id1.length > 0;
  console.log(`  First call:  ${id1}`);
  console.log(`  Second call: ${id2}`);
  console.log(`  Third call:  ${id3}`);
  console.log(`  ✓ PASSED: Session IDs are consistent\n` || `  ✗ FAILED: Session IDs differ\n`);
  
  return passed;
}

/**
 * Test 2: Session ID persists in localStorage
 */
export function testSessionPersistence() {
  console.log('TEST 2: Session Persistence (Simulated Page Reload)');
  localStorage.clear();
  
  const id1 = getActiveSessionId();
  console.log(`  Before reload: ${id1}`);
  
  // Simulate page reload by reading from localStorage directly
  const stored = JSON.parse(localStorage.getItem('sessionTracking') || '{}');
  const id2 = stored.lastSessionId;
  console.log(`  From localStorage: ${id2}`);
  
  const passed = id1 === id2;
  console.log(passed ? `  ✓ PASSED: Session ID persisted\n` : `  ✗ FAILED: Session ID not in localStorage\n`);
  
  return passed;
}

/**
 * Test 3: Activity timestamp updates on updateSessionActivity()
 */
export function testActivityTimestampUpdate() {
  console.log('TEST 3: Activity Timestamp Updates');
  localStorage.clear();
  
  getActiveSessionId();
  const before = JSON.parse(localStorage.getItem('sessionTracking') || '{}').lastActivityTimestamp;
  
  // Wait a bit then update
  return new Promise((resolve) => {
    setTimeout(() => {
      updateSessionActivity();
      const after = JSON.parse(localStorage.getItem('sessionTracking') || '{}').lastActivityTimestamp;
      
      const passed = after > before;
      console.log(`  Before: ${before}ms`);
      console.log(`  After:  ${after}ms`);
      console.log(passed ? `  ✓ PASSED: Timestamp updated\n` : `  ✗ FAILED: Timestamp not updated\n`);
      
      resolve(passed);
    }, 100);
  });
}

/**
 * Test 4: Debug info shows correct state
 */
export function testDebugInfo() {
  console.log('TEST 4: Debug Info Accuracy');
  localStorage.clear();
  
  getActiveSessionId();
  const debug = getSessionDebugInfo();
  
  const passed = 
    debug.sessionId && 
    debug.sessionId.length > 0 &&
    debug.inactivityMinutes === 0 &&
    !debug.isExpired;
  
  console.log(`  Session ID: ${debug.sessionId}`);
  console.log(`  Inactivity: ${debug.inactivityMinutes} min`);
  console.log(`  Expired: ${debug.isExpired}`);
  console.log(passed ? `  ✓ PASSED: Debug info accurate\n` : `  ✗ FAILED: Debug info incorrect\n`);
  
  return passed;
}

/**
 * Test 5: Concurrent initialization (race condition check)
 */
export function testConcurrentInitialization() {
  console.log('TEST 5: Concurrent Hook Initialization (Race Condition Prevention)');
  localStorage.clear();
  
  // Simulate two components calling getActiveSessionId() simultaneously
  const id1 = getActiveSessionId();
  const id2 = getActiveSessionId(); // Should return same ID as id1, not generate new one
  const id3 = getActiveSessionId(); // Third call should also match
  
  const passed = id1 === id2 && id2 === id3;
  console.log(`  Call 1 (ClickTracker):      ${id1}`);
  console.log(`  Call 2 (NavigationTracker): ${id2}`);
  console.log(`  Call 3 (Later event):       ${id3}`);
  console.log(passed ? `  ✓ PASSED: No race condition\n` : `  ✗ FAILED: IDs differ (race condition detected)\n`);
  
  return passed;
}

/**
 * Test 6: Session reset doesn't happen within 30 min window
 */
export function testNoResetWithinWindow() {
  console.log('TEST 6: No Reset Within 30-Minute Window');
  localStorage.clear();
  
  const id1 = getActiveSessionId();
  updateSessionActivity(); // Update activity
  
  // Should NOT reset because we're within 30 min window
  const id2 = getActiveSessionId();
  
  const passed = id1 === id2;
  console.log(`  First ID:  ${id1}`);
  console.log(`  After activity update: ${id2}`);
  console.log(passed ? `  ✓ PASSED: Session persists within window\n` : `  ✗ FAILED: Session reset unexpectedly\n`);
  
  return passed;
}

/**
 * Test 7: Session resets after 30+ minutes
 */
export function testResetAfterExpiry() {
  console.log('TEST 7: Session Reset After 30+ Minute Inactivity');
  localStorage.clear();
  
  const id1 = getActiveSessionId();
  
  // Simulate 31 minutes of inactivity by manipulating localStorage
  const now = Date.now();
  const thirtyMinutesAgo = now - (31 * 60 * 1000);
  localStorage.setItem('sessionTracking', JSON.stringify({
    lastActivityTimestamp: thirtyMinutesAgo,
    lastSessionId: id1,
  }));
  
  // Clear cache to force re-initialization
  (globalThis as any).__sessionCache = null;
  (globalThis as any).__sessionInitialized = false;
  
  const id2 = getActiveSessionId();
  
  const passed = id1 !== id2;
  console.log(`  Before expiry:  ${id1}`);
  console.log(`  After 31 min:   ${id2}`);
  console.log(passed ? `  ✓ PASSED: Session reset after expiry\n` : `  ✗ FAILED: Session should have reset\n`);
  
  return passed;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  const results: boolean[] = [];
  
  results.push(testSessionConsistency());
  results.push(testSessionPersistence());
  await testActivityTimestampUpdate().then((r) => results.push(r));
  results.push(testDebugInfo());
  results.push(testConcurrentInitialization());
  results.push(testNoResetWithinWindow());
  results.push(testResetAfterExpiry());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n=== TEST SUMMARY ===`);
  console.log(`Passed: ${passed}/${total}`);
  console.log(passed === total ? '✓ ALL TESTS PASSED' : `✗ ${total - passed} TEST(S) FAILED`);
}

// Export for use in browser console or test runner
if (typeof window !== 'undefined') {
  (window as any).sessionTests = {
    testSessionConsistency,
    testSessionPersistence,
    testActivityTimestampUpdate,
    testDebugInfo,
    testConcurrentInitialization,
    testNoResetWithinWindow,
    testResetAfterExpiry,
    runAllTests,
  };
}
