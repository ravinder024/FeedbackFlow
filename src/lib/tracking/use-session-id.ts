/**
 * Session ID Management Hook
 *
 * Provides session tracking with 30-minute inactivity timeout.
 * Uses module-level caching to prevent race conditions when multiple
 * components initialize simultaneously (ClickTracker + NavigationTracker).
 *
 * localStorage schema:
 * {
 *   sessionTracking: {
 *     lastActivityTimestamp: number (ms),
 *     lastSessionId: string (for reference)
 *   }
 * }
 */

import { useEffect, useState } from 'react';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = 'sessionTracking';

interface SessionState {
  sessionId: string | null;
  isLoading: boolean;
}

// Module-level cache to prevent race conditions between multiple hook instances
// Both ClickTracker and NavigationTracker call useSessionId() simultaneously
// Without caching, they could generate different UUIDs and overwrite each other
let cachedSessionId: string | null = null;
let isInitialized = false;

/**
 * Parse sessionId from document.cookie
 * Middleware sets: sessionId=<value>; HttpOnly; Secure; SameSite=Strict
 *
 * Note: We can't read HttpOnly cookies from JS, so we rely on a different approach:
 * The server will set the cookie, and the middleware will provide sessionId via a
 * custom header or we'll generate it client-side and sync with server.
 *
 * For now: read from localStorage (client-generated) or fall back to generation
 */
function getStoredSessionState(): { sessionId: string | null; lastActivityMs: number } {
  try {
    if (typeof window === 'undefined') {
      return { sessionId: null, lastActivityMs: 0 };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { sessionId: null, lastActivityMs: 0 };
    }

    const parsed = JSON.parse(stored) as { lastActivityTimestamp?: number; lastSessionId?: string };
    return {
      sessionId: parsed.lastSessionId || null,
      lastActivityMs: parsed.lastActivityTimestamp || 0,
    };
  } catch {
    // Corrupted storage, treat as fresh
    return { sessionId: null, lastActivityMs: 0 };
  }
}

/**
 * Store session state in localStorage
 */
function setStoredSessionState(sessionId: string, lastActivityMs: number): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lastActivityTimestamp: lastActivityMs,
        lastSessionId: sessionId,
      })
    );
  } catch {
    // localStorage full or unavailable, silently fail
  }
}

/**
 * Check if session has expired (> 30 min of inactivity)
 */
function isSessionExpired(lastActivityMs: number): boolean {
  if (lastActivityMs === 0) return true; // Never set, treat as expired
  const now = Date.now();
  return now - lastActivityMs > INACTIVITY_TIMEOUT_MS;
}

/**
 * Get or create active session ID
 * - Uses module-level cache to prevent race conditions
 * - If cached → return immediately (synchronized across all hooks)
 * - If no session exists OR session expired → generate new UUID + store + cache
 * - Otherwise → return existing sessionId
 */
export function getActiveSessionId(): string {
  // Return cached value if already initialized (fast path)
  if (isInitialized && cachedSessionId) {
    return cachedSessionId;
  }

  const { sessionId, lastActivityMs } = getStoredSessionState();

  // Session exists and not expired
  if (sessionId && !isSessionExpired(lastActivityMs)) {
    // Cache it for subsequent calls
    cachedSessionId = sessionId;
    isInitialized = true;
    return sessionId;
  }

  // Session missing or expired → generate new one (only once due to isInitialized flag)
  if (!isInitialized) {
    const newSessionId = crypto.randomUUID();
    const now = Date.now();
    setStoredSessionState(newSessionId, now);
    cachedSessionId = newSessionId;
    isInitialized = true;

    if (typeof console !== 'undefined' && console.debug) {
      if (sessionId) {
        console.debug('[SessionTracker] Session expired, new ID generated:', newSessionId);
      } else {
        console.debug('[SessionTracker] Initial session created:', newSessionId);
      }
    }

    return newSessionId;
  }

  // Fallback (should not reach here)
  return cachedSessionId || '';
}

/**
 * Update session last activity timestamp
 * Call this on every user event (click, navigation, etc.)
 */
export function updateSessionActivity(): void {
  const { sessionId } = getStoredSessionState();
  if (!sessionId) {
    // If no session exists, getActiveSessionId will create one
    getActiveSessionId();
    return;
  }

  const now = Date.now();
  setStoredSessionState(sessionId, now);
}

/**
 * React hook to get the active session ID
 * Handles SSR (returns null during build) and client-side generation
 */
export function useSessionId(): SessionState {
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    isLoading: true,
  });

  useEffect(() => {
    // Hydrate session ID from localStorage
    const sessionId = getActiveSessionId();
    setState({
      sessionId,
      isLoading: false,
    });
  }, []);

  return state;
}

/**
 * Non-hook version for use outside React components
 * Returns sessionId synchronously (after hydration) or null during SSR
 */
export function getSessionIdSync(): string | null {
  if (typeof window === 'undefined') {
    return null; // SSR, can't access localStorage
  }
  return getActiveSessionId();
}

/**
 * Check if session has been reset due to expiry
 * Call this before sending events if 30min+ has passed since last activity
 * Returns current session ID (creates new one if expired)
 */
export function checkAndResetSessionIfExpired(): string {
  const { sessionId, lastActivityMs } = getStoredSessionState();

  // Session expired → clear cache and regenerate
  if (sessionId && isSessionExpired(lastActivityMs)) {
    cachedSessionId = null;
    isInitialized = false;
    return getActiveSessionId();
  }

  // Session still active → return cached value
  return getActiveSessionId();
}

/**
 * Get debug info about current session state
 */
export function getSessionDebugInfo() {
  const { sessionId, lastActivityMs } = getStoredSessionState();
  const now = Date.now();
  const isExpired = isSessionExpired(lastActivityMs);
  const inactivityMs = lastActivityMs > 0 ? now - lastActivityMs : 0;

  return {
    sessionId,
    lastActivityMs: lastActivityMs > 0 ? new Date(lastActivityMs).toISOString() : 'never',
    inactivityMinutes: Math.round(inactivityMs / 60000),
    expired: isExpired,
    storagePath: STORAGE_KEY,
  };
}

/**
 * TESTING ONLY: Clear module-level cache
 * Used in Jest tests to reset state between test cases
 */
export function __TEST_clearCache(): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
    cachedSessionId = null;
    isInitialized = false;
  }
}
