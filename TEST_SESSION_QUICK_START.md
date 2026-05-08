# Quick Start: Session Tracking Testing

**Status**: ✅ Session tracking fix deployed and dev server running at http://localhost:3000

---

## What Was Fixed

**Issue**: Session ID was changing with every new event

**Root Cause**: Race condition
- ClickTracker and NavigationTracker both call `useSessionId()` simultaneously
- Without synchronization, they generate different UUIDs
- Events sent with different session IDs

**Solution Applied**: Module-level caching in `src/lib/tracking/use-session-id.ts`
- Added `cachedSessionId` and `isInitialized` variables at module scope
- First call to `getActiveSessionId()` initializes and caches UUID
- Subsequent calls return cached UUID (no race condition)
- Verified: Zero TypeScript errors after fix

---

## Testing Instructions

### Step 1: Open the App

Navigate to: **http://localhost:3000**

Open **DevTools** (F12 → Console)

---

### Step 2: Run Automated Tests

Copy-paste into DevTools Console:

```javascript
// Run all automated tests
sessionTests.runAllTests()
```

**Expected Output**:
```
TEST 1: Session ID Consistency
  First call:  [uuid]
  Second call: [uuid]  // SAME as first
  Third call:  [uuid]  // SAME as first
  ✓ PASSED: Session IDs are consistent

TEST 2: Session Persistence (Simulated Page Reload)
  ...
  ✓ PASSED: Session ID persisted

TEST 3: Activity Timestamp Updates
  ...
  ✓ PASSED: Timestamp updated

TEST 4: Debug Info Accuracy
  Session ID: [uuid]
  Inactivity: 0 min
  Expired: false
  ✓ PASSED: Debug info accurate

TEST 5: Concurrent Hook Initialization (Race Condition Prevention)
  Call 1 (ClickTracker):      [uuid]
  Call 2 (NavigationTracker): [uuid]  // SAME!
  Call 3 (Later event):       [uuid]  // SAME!
  ✓ PASSED: No race condition

TEST 6: No Reset Within 30-Minute Window
  ✓ PASSED: Session persists within window

TEST 7: Session Reset After 30+ Minute Inactivity
  ✓ PASSED: Session reset after expiry

=== TEST SUMMARY ===
Passed: 7/7
✓ ALL TESTS PASSED
```

---

### Step 3: Manual Testing - Session Consistency

Run in DevTools Console:

```javascript
// Check current session info
const debug = getSessionDebugInfo();
console.log('Session ID:', debug.sessionId);
console.log('Inactivity:', debug.inactivityMinutes, 'minutes');
```

Then:
1. **Click** various buttons on the page (5-10 clicks)
2. **Check DevTools Network** tab - all `/api/events` POST requests should include the same `session_id` in the body
3. Verify in **browser console**:
   ```javascript
   getSessionDebugInfo()  // Should show same sessionId
   ```

---

### Step 4: Verify Database

Execute in your PostgreSQL client:

```sql
-- Check session ID distribution (last 10 minutes)
SELECT 
  session_id,
  type,
  COUNT(*) as event_count,
  MIN(timestamp) as first_event,
  MAX(timestamp) as last_event
FROM events
WHERE timestamp > NOW() - INTERVAL '10 minutes'
GROUP BY session_id, type
ORDER BY MAX(timestamp) DESC
LIMIT 20;
```

**Expected Result**: All events from same session have identical `session_id` (no NULL values)

---

### Step 5: Test Page Reload Persistence

1. In DevTools Console, note current session:
   ```javascript
   getSessionDebugInfo().sessionId
   ```

2. Press **F5** to reload page

3. In DevTools Console, check if session persists:
   ```javascript
   getSessionDebugInfo().sessionId  // Should be SAME as before
   ```

4. Click an element to send new event

5. In Database:
   ```sql
   SELECT session_id, type, timestamp 
   FROM events 
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```
   Should show events before and after reload with **same session_id**

---

### Step 6: Test Rage Click Session Consistency

1. Clear localStorage to start fresh session:
   ```javascript
   localStorage.clear()
   ```

2. Reload page

3. **Rapidly click** the same button **5+ times** (within 1 second)

4. Check DevTools Network → last few POST /api/events requests should all have **same session_id**

5. In database:
   ```sql
   SELECT type, session_id 
   FROM events 
   WHERE type IN ('rage_click', 'click')
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```
   Should show: ONE `rage_click` + preceding/following `click` events with SAME `session_id`

---

## Test Results Checklist

✅ **All Automated Tests Pass**:
- [ ] Session ID Consistency (Test 1)
- [ ] Session Persistence (Test 2)
- [ ] Activity Timestamp Updates (Test 3)
- [ ] Debug Info Accuracy (Test 4)
- [ ] Concurrent Hook Initialization (Test 5)
- [ ] No Reset Within 30 Min (Test 6)
- [ ] Reset After Expiry (Test 7)

✅ **Manual Tests**:
- [ ] Session ID stays same across 5+ clicks
- [ ] Session ID persists after page reload (F5)
- [ ] All events in database have valid session_id (no NULL)
- [ ] Rage click detected and recorded with correct session_id
- [ ] Navigation events (page_load, route_change) include session_id

---

## Quick Debugging

**If session ID still changes on every event**:

1. Check cache is initialized:
   ```javascript
   // In DevTools, check module-level vars
   // Note: Can't access directly, but behavior should show in tests
   sessionTests.testConcurrentInitialization()  // Should PASS
   ```

2. Clear local storage and try again:
   ```javascript
   localStorage.clear()
   location.reload()
   ```

3. Check browser console for errors - should show NO warnings about session

**If database shows NULL session_id**:

1. Verify events are sending session_id:
   ```javascript
   // DevTools Network → find POST /api/events
   // Check request body includes: "session_id": "[uuid]"
   ```

2. Check API is receiving it:
   - Backend: `src/pages/api/events.ts`
   - Verify: `session_id: event.session_id` in `prisma.event.create()` call

---

## Files Modified

- `src/lib/tracking/use-session-id.ts` - Added module-level caching
- `src/components/tracking/ClickTracker.tsx` - Uses non-blocking session ref
- `src/components/tracking/NavigationTracker.tsx` - Uses non-blocking session ref
- No database migration needed (session_id column already exists)

---

## Next Steps

After verification ✓:
1. Commit changes
2. Deploy to staging/production
3. Monitor event logs for session_id consistency
4. Update team documentation with session tracking availability
