import { useEffect, useRef } from 'react';
import { getClickSelector } from '@/lib/tracking/get-click-selector';
import { detectRageClick } from '@/lib/tracking/rage-click-detector';
import { isInteractiveElement, startDeadClickMonitoring, cancelAllDeadClickMonitoring } from '@/lib/tracking/dead-click-detector';
import { useSessionId, updateSessionActivity, getActiveSessionId } from '@/lib/tracking/use-session-id';
import { pushEvent, getFilteredBufferedEvents, type BufferedEvent } from '@/lib/tracking/event-buffer';
import { buildIssue } from '@/lib/tracking/context-builder';
import { recordIssue } from '@/lib/tracking/issue-store';

function getCurrentPage(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * Send a single tracking event to the API.
 * Silent failure — tracking never impacts UX.
 */
function sendEvent(payload: { type: string; element: string; page: string; session_id?: string; previous_events?: BufferedEvent[] }): void {
  void fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Log the generated structured issue to console for testing/debugging.
 * Also persists the issue to the in-memory store for later retrieval.
 * Used for rage_click and dead_click events to visualize the context builder output.
 */
function logGeneratedIssue(eventType: string, element?: string, page?: string, previousEvents?: BufferedEvent[], sessionId?: string): void {
  const issue = buildIssue({ type: eventType, element, page, previous_events: previousEvents });
  if (issue) {
    // Persist to issue store
    recordIssue(issue, sessionId);
    // Log for debugging
    console.log(
      `%c✓ Generated Issue: ${issue.issue_type}`,
      'color: #ff9800; font-weight: bold; font-size: 12px;'
    );
    console.log(JSON.stringify(issue, null, 2));
  }
}

// ── Pending click coordination ──────────────────────────────────────
// Exported so NavigationTracker can cancel a buffered click when
// navigation starts (prevents click + navigation duplicates).
let pendingClickTimer: ReturnType<typeof setTimeout> | null = null;

export function cancelPendingClick(): void {
  if (pendingClickTimer !== null) {
    clearTimeout(pendingClickTimer);
    pendingClickTimer = null;
  }
}
// ────────────────────────────────────────────────────────────────────

export default function ClickTracker() {
  const { sessionId } = useSessionId();
  const sessionIdRef = useRef<string | null>(null);

  // Update ref when sessionId becomes available (non-blocking)
  useEffect(() => {
    if (sessionId) {
      sessionIdRef.current = sessionId;
      updateSessionActivity();
    }
  }, [sessionId]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!event.isTrusted) return;

      const element = getClickSelector(event.target);
      const page = getCurrentPage();
      const currentTime = Date.now();

      // Track activity if session is available
      if (sessionIdRef.current) {
        updateSessionActivity();
      }

      const rageOrClickEvent = detectRageClick(element, currentTime);

      // Hard suppression phase — drop silently
      if (rageOrClickEvent === null) return;

      // ═══════ PRIORITY 1: RAGE CLICK ═══════
      // Send immediately. Cancel any buffered click AND dead monitors
      // from prior clicks in the rage sequence.
      if (rageOrClickEvent === 'rage_click') {
        cancelPendingClick();
        cancelAllDeadClickMonitoring();
        // Snapshot filtered context BEFORE pushing current event into buffer
        // Only include click and navigation events, exclude dead/rage clicks for clean signal
        const previousEvents = getFilteredBufferedEvents();
        pushEvent({ type: 'rage_click', element, page, timestamp: currentTime });
        // Fallback: ensure session exists even if useEffect timing delayed it
        const safeSessionId = sessionIdRef.current || getActiveSessionId();
        sendEvent({ type: 'rage_click', element, page, session_id: safeSessionId || undefined, previous_events: previousEvents });
        // Log the generated issue for testing and persist to store
        logGeneratedIssue('rage_click', element, page, previousEvents, safeSessionId || undefined);
        return;
      }

      // ═══════ PRIORITY 2 & 3: DEAD CLICK / CLICK ═══════
      // Cancel any previous pending click and dead monitors (fresh slate).
      cancelPendingClick();
      cancelAllDeadClickMonitoring();

      if (isInteractiveElement(event.target as Element)) {
        // Interactive element — defer 450ms so dead-click check (400ms) can
        // finish first. NavigationTracker may also cancel this timer if a
        // route change starts during the window.
        let deadClickFired = false;

        startDeadClickMonitoring(
          event.target as Element,
          element,
          page,
          (deadElement, deadPage) => {
            deadClickFired = true;
            cancelPendingClick(); // Don't also send a regular click
            // Snapshot filtered context BEFORE pushing current event into buffer
            // Only include click and navigation events, exclude dead/rage clicks for clean signal
            const previousEvents = getFilteredBufferedEvents();
            pushEvent({ type: 'dead_click', element: deadElement, page: deadPage, timestamp: Date.now() });
            // Fallback: ensure session exists even if useEffect timing delayed it
            const safeSessionId = sessionIdRef.current || getActiveSessionId();
            sendEvent({ type: 'dead_click', element: deadElement, page: deadPage, session_id: safeSessionId || undefined, previous_events: previousEvents });
            // Log the generated issue for testing and persist to store
            logGeneratedIssue('dead_click', deadElement, deadPage, previousEvents, safeSessionId || undefined);
          }
        );

        // After 450ms: if dead-click didn't fire AND timer wasn't cancelled
        // by navigation, send a regular click.
        pendingClickTimer = setTimeout(() => {
          pendingClickTimer = null;
          if (!deadClickFired) {
            pushEvent({ type: 'click', element, page, timestamp: Date.now() });
            // Fallback: ensure session exists even if useEffect timing delayed it
            const safeSessionId = sessionIdRef.current || getActiveSessionId();
            sendEvent({ type: 'click', element, page, session_id: safeSessionId || undefined });
          }
        }, 450);
      } else {
        // Non-interactive element — no dead-click check needed.
        // Buffer through pendingClickTimer so subsequent clicks in a rage
        // sequence can cancel this one before it sends.
        pendingClickTimer = setTimeout(() => {
          pendingClickTimer = null;
          pushEvent({ type: 'click', element, page, timestamp: Date.now() });
          // Fallback: ensure session exists even if useEffect timing delayed it
          const safeSessionId = sessionIdRef.current || getActiveSessionId();
          sendEvent({ type: 'click', element, page, session_id: safeSessionId || undefined });
        }, 450);
      }
    };

    document.addEventListener('click', handleClick, true);

    // On hard navigation, clean up everything
    const handleNavigation = () => {
      cancelAllDeadClickMonitoring();
      cancelPendingClick();
    };

    window.addEventListener('beforeunload', handleNavigation);
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('beforeunload', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
      cancelAllDeadClickMonitoring();
      cancelPendingClick();
    };
  }, []);

  return null;
}