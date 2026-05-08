/**
 * SessionInitializer
 *
 * Initializes the user session at app startup.
 * Must be rendered at the TOP of _app.tsx before ClickTracker and NavigationTracker.
 *
 * This component ensures:
 * 1. Session ID is created/loaded synchronously before any events fire
 * 2. Initial page_load event includes valid session_id (no nulls)
 * 3. All subsequent events use the same session_id
 *
 * Flow:
 * - Component mounts → calls getActiveSessionId() synchronously
 * - localStorage is populated immediately
 * - Children (ClickTracker, NavigationTracker) can safely read session_id
 */

import { useEffect } from 'react';
import { getActiveSessionId } from '@/lib/tracking/use-session-id';

export default function SessionInitializer(): null {
  useEffect(() => {
    // Initialize session ID synchronously.
    // This function:
    // 1. Checks if session already exists in localStorage
    // 2. If expired → generates new UUID
    // 3. If missing → generates new UUID
    // 4. Returns the session ID immediately
    // 5. Module-level cache prevents race conditions
    const sessionId = getActiveSessionId();
    
    if (typeof window !== 'undefined' && console.debug) {
      console.debug('[SessionInitializer] Session ready:', sessionId);
    }
  }, []); // Run only once on mount

  return null;
}
