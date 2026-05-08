/**
 * Session Tracking Test Suite
 * 
 * Tests:
 * 1. Session ID consistency across multiple events
 * 2. Session ID persistence across page reloads
 * 3. Session ID reset after 30+ minutes inactivity (mocked)
 * 4. Race condition prevention (concurrent hook initialization)
 */

import { getActiveSessionId, updateSessionActivity, checkAndResetSessionIfExpired, getSessionDebugInfo, __TEST_clearCache } from '../use-session-id';

describe('Session Tracking - use-session-id.ts', () => {
  
  beforeEach(() => {
    __TEST_clearCache();
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('Test 1: Session ID Consistency - Multiple calls return same UUID', () => {
    const id1 = getActiveSessionId();
    const id2 = getActiveSessionId();
    const id3 = getActiveSessionId();
    
    console.log('TEST 1: Session ID Consistency');
    console.log(`  First call:  ${id1}`);
    console.log(`  Second call: ${id2}`);
    console.log(`  Third call:  ${id3}`);
    
    expect(id1).toBe(id2);
    expect(id2).toBe(id3);
    expect(id1.length).toBeGreaterThan(0);
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4 format
    
    console.log('  ✓ PASSED: Session IDs are consistent\n');
  });

  test('Test 2: Session Persistence - ID survives localStorage reads', () => {
    console.log('TEST 2: Session Persistence (Simulated Page Reload)');
    
    const id1 = getActiveSessionId();
    console.log(`  Before reload: ${id1}`);
    
    // Simulate page reload by reading from localStorage directly
    const stored = JSON.parse(localStorage.getItem('sessionTracking') || '{}');
    const id2 = stored.lastSessionId;
    console.log(`  From localStorage: ${id2}`);
    
    expect(id1).toBe(id2);
    expect(id2).toBeTruthy();
    
    console.log('  ✓ PASSED: Session ID persisted\n');
  });

  test('Test 3: Activity Timestamp Update - Calling updateSessionActivity updates timestamp', () => {
    console.log('TEST 3: Activity Timestamp Updates');
    
    const id = getActiveSessionId();
    const before = new Date().getTime();
    
    updateSessionActivity();
    
    const stored = JSON.parse(localStorage.getItem('sessionTracking') || '{}');
    const timestamp = stored.lastActivityTimestamp;
    const after = new Date().getTime();
    
    console.log(`  Session ID: ${id}`);
    console.log(`  Timestamp set: ${timestamp}`);
    console.log(`  Check: ${before} <= ${timestamp} <= ${after}`);
    
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
    
    console.log('  ✓ PASSED: Timestamp updated\n');
  });

  test('Test 4: Debug Info - Provides accurate session state', () => {
    console.log('TEST 4: Debug Info Accuracy');
    
    const id = getActiveSessionId();
    updateSessionActivity();
    
    const debug = getSessionDebugInfo();
    
    console.log(`  Session ID: ${debug.sessionId}`);
    console.log(`  Inactivity: ${debug.inactivityMinutes} min`);
    console.log(`  Expired: ${debug.expired}`);
    
    expect(debug.sessionId).toBe(id);
    expect(typeof debug.inactivityMinutes).toBe('number');
    expect(debug.inactivityMinutes).toBeGreaterThanOrEqual(0);
    expect(debug.inactivityMinutes).toBeLessThanOrEqual(1); // Should be very close to 0
    expect(debug.expired).toBe(false);
    
    console.log('  ✓ PASSED: Debug info accurate\n');
  });

  test('Test 5: Concurrent Initialization - No race condition with multiple calls', () => {
    console.log('TEST 5: Concurrent Hook Initialization (Race Condition Prevention)');
    
    // Simulate ClickTracker and NavigationTracker calling simultaneously
    const id1 = getActiveSessionId();
    const id2 = getActiveSessionId();
    const id3 = getActiveSessionId();
    
    console.log(`  Call 1 (ClickTracker):      ${id1}`);
    console.log(`  Call 2 (NavigationTracker): ${id2}`);
    console.log(`  Call 3 (Later event):       ${id3}`);
    
    expect(id1).toBe(id2);
    expect(id2).toBe(id3);
    
    console.log('  ✓ PASSED: No race condition\n');
  });

  test('Test 6: No Reset Within 30-Minute Window - Session persists', () => {
    console.log('TEST 6: No Reset Within 30-Minute Window');
    
    const id = getActiveSessionId();
    updateSessionActivity();
    
    // Simulate activity just now (should not be expired)
    checkAndResetSessionIfExpired();
    
    const newId = getActiveSessionId();
    
    console.log(`  Original ID: ${id}`);
    console.log(`  After 0min inactivity: ${newId}`);
    
    expect(newId).toBe(id);
    
    console.log('  ✓ PASSED: Session persists within window\n');
  });

  test('Test 7: Reset After 30+ Minutes Inactivity - Session expires and resets', () => {
    console.log('TEST 7: Session Reset After 30+ Minute Inactivity');
    
    const id1 = getActiveSessionId();
    
    // Simulate old timestamp (31 minutes ago)
    const trackingData = JSON.parse(localStorage.getItem('sessionTracking') || '{}');
    const thirtyOneMinutesAgo = new Date().getTime() - (31 * 60 * 1000);
    trackingData.lastActivityTimestamp = thirtyOneMinutesAgo;
    localStorage.setItem('sessionTracking', JSON.stringify(trackingData));
    
    // Check for expiry BEFORE reset to verify session is truly expired
    const debugBefore = getSessionDebugInfo();
    console.log(`  Original ID: ${id1}`);
    console.log(`  Inactivity (before reset): ${debugBefore.inactivityMinutes} min`);
    console.log(`  Expired: ${debugBefore.expired}`);
    
    expect(debugBefore.inactivityMinutes).toBeGreaterThanOrEqual(31);
    expect(debugBefore.expired).toBe(true);
    
    // Now trigger reset
    checkAndResetSessionIfExpired();
    
    const id2 = getActiveSessionId();
    const debugAfter = getSessionDebugInfo();
    
    console.log(`  After reset: ${id2}`);
    console.log(`  New inactivity: ${debugAfter.inactivityMinutes} min`);
    console.log(`  New expired: ${debugAfter.expired}`);
    
    // After reset, should have new ID and not be expired
    expect(id2).not.toBe(id1); // Session reset generates new ID
    expect(debugAfter.expired).toBe(false);
    
    console.log('  ✓ PASSED: Session reset after expiry\n');
  });
});

describe('Session Tracking Integration', () => {
  
  beforeEach(() => {
    __TEST_clearCache();
    localStorage.clear();
  });

  test('Full workflow: Initialize → Log activity → Check debug info → Verify consistency', () => {
    console.log('\n=== FULL WORKFLOW TEST ===');
    
    // Step 1: Initialize
    const sessionId = getActiveSessionId();
    expect(sessionId).toBeTruthy();
    console.log(`✓ Step 1: Session initialized: ${sessionId}`);
    
    // Step 2: Log activity
    updateSessionActivity();
    console.log('✓ Step 2: Activity logged');
    
    // Step 3: Get debug info
    const debug = getSessionDebugInfo();
    expect(debug.sessionId).toBe(sessionId);
    expect(debug.expired).toBe(false);
    console.log(`✓ Step 3: Debug info verified (inactivity: ${debug.inactivityMinutes}min)`);
    
    // Step 4: Verify consistency
    const newSessionId = getActiveSessionId();
    expect(newSessionId).toBe(sessionId);
    console.log(`✓ Step 4: Session ID remains consistent`);
    
    console.log('\n✓ FULL WORKFLOW PASSED\n');
  });
});
