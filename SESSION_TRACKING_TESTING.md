# Session Tracking Testing Guide

## Overview

This guide provides comprehensive testing procedures to verify that session tracking is working correctly and that the race condition issue (session ID changing with every event) has been resolved.

**Key Fix Applied**: Module-level caching in `use-session-id.ts` prevents race conditions when ClickTracker and NavigationTracker initialize simultaneously.

---

## What Was Fixed

**Problem**: Session ID changed with every event
- **Root Cause**: Race condition in concurrent hook initialization
  - ClickTracker calls `useSessionId()` → generates UUID-A
  - NavigationTracker calls `useSessionId()` → generates UUID-B (overwrites UUID-A)
  - Events sent with different session IDs
- **Solution**: Added module-level cache (`cachedSessionId`, `isInitialized`) to ensure single initialization

---

## Test Scenarios

### Scenario 1: Session ID Consistency Within Single Session

**Objective**: Verify that multiple events within a session use the same session ID

**Steps**:
1. Open browser DevTools Console
2. Run test: `sessionTests.testSessionConsistency()`
3. Manually click elements on the page (5-10 clicks)
4. Check database for events:
   ```sql
   SELECT session_id, COUNT(*) as event_count 
   FROM events 
   WHERE type IN ('click', 'rage_click', 'dead_click')
   ORDER BY timestamp DESC 
   LIMIT 20;
   ```

**Expected Result**:
- All recent clicks from same session have SAME `session_id`
- No mixing of different UUIDs in quick succession
- Console shows: `✓ PASSED: Session IDs are consistent`

**Test Command**: 
```javascript
sessionTests.testSessionConsistency()
```

---

### Scenario 2: Session ID Persistence Across Page Reload

**Objective**: Verify session ID survives F5 / page reload

**Steps**:
1. Open page (initial session_id created)
2. Open DevTools: `getSessionDebugInfo()` → note the `sessionId`
3. Perform an action (click element) → triggers event
4. Press F5 to reload page
5. After reload, check: `getSessionDebugInfo()` → compare `sessionId`
6. Click another element
7. Check database for events from before and after reload

**Expected Result**:
- Session ID is identical before and after reload
- Both events (before + after reload) have same `session_id` in database
- Console shows: `✓ PASSED: Session ID persisted`

**Test Command**:
```javascript
getSessionDebugInfo()  // Step 2 & 5
```

---

### Scenario 3: No Session ID Changes on Rapid Events

**Objective**: Verify concurrent events (rage click) use same session ID

**Steps**:
1. Clear browser cache: DevTools → Application → Storage → Clear All
2. Reload page
3. Rapidly click same button 5+ times (to trigger rage click detection)
4. Check events sent:
   ```sql
   SELECT type, session_id, timestamp 
   FROM events 
   WHERE type IN ('rage_click', 'click')
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```

**Expected Result**:
- Rage click event has same `session_id` as preceding/following events
- Only ONE rage_click sent (not multiple clicks)
- All events share identical session ID
- No log error messages about session mismatches

**Browser DevTools Console**:
```javascript
// Before rage click test
console.clear();
getSessionDebugInfo(); // Note the ID
```

---

### Scenario 4: Navigation Events Include Session ID

**Objective**: Verify navigation events (page load, route change) include session_id

**Steps**:
1. Open page → check initial navigation event
2. Navigate to different page/route
3. Check database:
   ```sql
   SELECT type, subtype, session_id 
   FROM events 
   WHERE type = 'navigation'
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```

**Expected Result**:
- `page_load` event has session_id
- `route_change` events have same session_id
- `page_reload` has session_id (different if pages reloaded)
- All navigation events in same session share session_id

---

### Scenario 5: Session ID Reset After 30 Minutes

**Objective**: Verify session ID resets after 30 minutes of inactivity (or mocked)

**Steps - Manual (requires patience)**:
1. Create initial session: `getSessionDebugInfo()` → note ID
2. Wait 30 minutes without interacting
3. Click an element
4. Check database for session_id change

**Steps - Mocked (recommended)**:
1. Open DevTools Console
2. Set localStorage timestamp to 31 minutes ago:
   ```javascript
   // Get current session
   const session = JSON.parse(localStorage.getItem('sessionTracking'));
   session.lastActivityTimestamp = Date.now() - (31*60*1000); // 31 min ago
   localStorage.setItem('sessionTracking', JSON.stringify(session));
   
   // Clear module cache
   // (In real scenario, this happens on next page reload)
   ```
3. Reload page or click element
4. Run: `getSessionDebugInfo()` → session ID should be NEW
5. Check database → new session_id in recent events

**Test Command**:
```javascript
sessionTests.testResetAfterExpiry()
```

---

### Scenario 6: Concurrent Hook Initialization (Race Condition Test)

**Objective**: Verify both ClickTracker and NavigationTracker get SAME session_id

**Steps**:
1. Open DevTools → Sources
2. Add breakpoint in `use-session-id.ts` at `getActiveSessionId()`
3. Trigger page load (both hooks initialize)
4. Step through both calls
5. Verify both return same UUID

**Direct Test**:
```javascript
sessionTests.testConcurrentInitialization()
```

**Expected Result**:
- Both concurrent calls return identical UUID
- No new UUID generated on second call
- Console shows: `✓ PASSED: No race condition`

---

### Scenario 7: Dead Click Events Include Session ID

**Objective**: Verify dead click detection includes session_id

**Steps**:
1. Find an unresponsive button on page
2. Click it and wait for dead-click detection (~400ms)
3. Check database:
   ```sql
   SELECT type, session_id 
   FROM events 
   WHERE type = 'dead_click'
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```

**Expected Result**:
- `dead_click` events have valid session_id
- Session IDs match other concurrent events from same session

---

## Automated Test Suite

Located in: `test-session-tracking.ts`

**To run all tests**:
```javascript
sessionTests.runAllTests()
```

**Individual tests**:
```javascript
sessionTests.testSessionConsistency()
sessionTests.testSessionPersistence()
sessionTests.testActivityTimestampUpdate()
sessionTests.testDebugInfo()
sessionTests.testConcurrentInitialization()
sessionTests.testNoResetWithinWindow()
sessionTests.testResetAfterExpiry()
```

---

## Database Verification Queries

### Query 1: Session ID Distribution
```sql
-- Should show ONE session_id per session (grouped by proximity in time)
SELECT 
  session_id,
  COUNT(*) as event_count,
  MIN(timestamp) as session_start,
  MAX(timestamp) as session_end,
  (MAX(timestamp) - MIN(timestamp)) as session_duration_ms
FROM events
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY session_id
ORDER BY session_start DESC;
```

### Query 2: Events Per Session ID
```sql
-- Verify no session_id appears with too many events (indicating reset issue)
SELECT 
  session_id,
  type,
  COUNT(*) as count
FROM events
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY session_id, type
ORDER BY COUNT(*) DESC;
```

### Query 3: Session ID Consistency Check
```sql
-- Should return TRUE (all sessions have consistent IDs across event types)
SELECT 
  session_id,
  COUNT(DISTINCT subtype) as subtype_variants
FROM events
WHERE type = 'navigation'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY session_id;
```

### Query 4: Latest Events
```sql
-- View most recent events with session IDs
SELECT 
  type,
  session_id,
  element,
  page,
  timestamp
FROM events
WHERE timestamp > NOW() - INTERVAL '10 minutes'
ORDER BY timestamp DESC
LIMIT 20;
```

---

## Success Criteria

✅ **All tests must pass**:
- [ ] Session ID consistency across multiple events
- [ ] Session ID persists after page reload
- [ ] Session ID updates activity timestamp
- [ ] Debug info is accurate
- [ ] No race condition in concurrent initialization
- [ ] Session doesn't reset within 30-minute window
- [ ] Session resets after 30+ minutes of inactivity
- [ ] Dead click events include session_id
- [ ] Navigation events include session_id
- [ ] Database queries show consistent session IDs per session

---

## Troubleshooting

**Problem**: Session ID changes on every event
- **Check**: Module cache might not be persisting. Verify `use-session-id.ts` has `cachedSessionId` and `isInitialized` vars
- **Fix**: Clear localStorage, reload, and re-test
- **Debug**: Run `getSessionDebugInfo()` before and after each event

**Problem**: Session ID different on navigation vs click events
- **Check**: Verify both ClickTracker and NavigationTracker use same `useSessionId()` hook
- **Debug**: Open DevTools Network → check POST /api/events payloads

**Problem**: Session doesn't reset after 30 minutes
- **Check**: Verify `isSessionExpired()` calculation is correct
- **Debug**: Manual test by setting `lastActivityTimestamp` to 31 min ago

**Problem**: Database shows null session_id values
- **Check**: Verify events are sending `session_id` in payload
- **Debug**: Check Network tab → /api/events POST body

---

## Checklist for Sign-Off

- [ ] Run all automated tests (`sessionTests.runAllTests()`) - all pass
- [ ] Manually test Scenario 1 (consistency) - works
- [ ] Manually test Scenario 2 (persistence across reload) - works
- [ ] Manually test Scenario 3 (rage clicks same ID) - works
- [ ] Manually test Scenario 6 (concurrent initialization) - works
- [ ] Run database queries - consistent session IDs
- [ ] No errors in browser console during testing
- [ ] No "session_id is null" warnings in logs
- [ ] Stress test: rapid clicks x20 - all same session_id
- [ ] Production deployment ready ✓
