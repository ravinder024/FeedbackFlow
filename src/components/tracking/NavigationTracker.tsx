import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { cancelPendingClick } from '@/components/tracking/ClickTracker';
import { useSessionId, updateSessionActivity, getActiveSessionId } from '@/lib/tracking/use-session-id';
import { pushEvent } from '@/lib/tracking/event-buffer';

/**
 * NavigationTracker
 *
 * Tracks page navigations (initial load + SPA route changes).
 * Sends navigation events independently — no shared classifier.
 *
 * Coordination with ClickTracker:
 * - On routeChangeStart: calls cancelPendingClick() to suppress any buffered
 *   click from the same interaction that triggered navigation.
 */

function sendNavigationEvent(
  page: string,
  subtype: 'page_load' | 'page_reload' | 'route_change',
  sessionId?: string | null
): void {
  void fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'navigation',
      subtype,
      page,
      session_id: sessionId,
    }),
    keepalive: true,
  }).catch(() => {});
}

export default function NavigationTracker(): null {
  const router = useRouter();
  const { sessionId } = useSessionId();
  const sessionIdRef = useRef<string | null>(null);
  const previousRouteRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Update ref when sessionId becomes available (non-blocking)
  useEffect(() => {
    if (sessionId) {
      sessionIdRef.current = sessionId;
      updateSessionActivity();
    }
  }, [sessionId]);

  useEffect(() => {
    if (!router.isReady) return;

    // ── Initial page load ──
    if (!initializedRef.current) {
      initializedRef.current = true;
      previousRouteRef.current = router.asPath;

      // Track activity if session is available
      if (sessionIdRef.current) {
        updateSessionActivity();
      }

      // Distinguish reload from fresh navigation using PerformanceNavigationTiming
      let subtype: 'page_load' | 'page_reload' = 'page_load';
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        if (navEntry?.type === 'reload') {
          subtype = 'page_reload';
        }
      } catch {
        // Fallback: page_load (API unavailable or SSR)
      }

      // Fallback: ensure session exists even if useEffect timing delayed it
      const safeSessionId = sessionIdRef.current || getActiveSessionId();
      pushEvent({ type: 'navigation', page: router.asPath, timestamp: Date.now() });
      sendNavigationEvent(router.asPath, subtype, safeSessionId);
      console.debug('[NavigationTracker] Initial load:', router.asPath, subtype);
    }

    // ── SPA route change: cancel pending click immediately ──
    const handleRouteChangeStart = () => {
      cancelPendingClick();
    };

    // ── SPA route change: send navigation event ──
    const handleRouteChangeComplete = (nextRoute: string) => {
      // Track activity if session is available
      if (sessionIdRef.current) {
        updateSessionActivity();
      }

      if (nextRoute !== previousRouteRef.current) {
        previousRouteRef.current = nextRoute;
        // Fallback: ensure session exists even if useEffect timing delayed it
        const safeSessionId = sessionIdRef.current || getActiveSessionId();
        pushEvent({ type: 'navigation', page: nextRoute, timestamp: Date.now() });
        sendNavigationEvent(nextRoute, 'route_change', safeSessionId);
        console.debug('[NavigationTracker] Route change:', nextRoute);
      }
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router, router.isReady]);

  return null;
}
