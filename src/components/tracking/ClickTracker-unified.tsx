import { useEffect } from 'react';
import { getClickSelector } from '@/lib/tracking/get-click-selector';
import { detectRageClick } from '@/lib/tracking/rage-click-detector';
import { isInteractiveElement, startDeadClickMonitoring, cancelAllDeadClickMonitoring } from '@/lib/tracking/dead-click-detector';

function getCurrentPage(): string {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

/**
 * Centralized event sender to avoid duplication and ensure consistency.
 * Sends a single event to the tracking API.
 */
function sendEvent(options: {
  type: 'click' | 'rage_click' | 'dead_click';
  element: string;
  page: string;
}): void {
  void fetch('/api/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: options.type,
      element: options.element,
      page: options.page,
    }),
    keepalive: true,
  }).catch(() => {
    // Tracking should never affect the main UX
  });
}

export default function ClickTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!event.isTrusted) {
        return;
      }

      const element = getClickSelector(event.target);
      const page = getCurrentPage();
      const currentTime = Date.now();

      // Get the event type from rage detector (synchronous, real-time check)
      const rageOrClickEvent = detectRageClick(element, currentTime);

      // If suppressed by rage detector (hard suppression phase), don't track
      if (rageOrClickEvent === null) {
        return;
      }

      // ========== PRIORITY 1: RAGE CLICK ==========
      // Rage click is real-time feedback of user frustration.
      // Send immediately without waiting or measuring dead_click.
      if (rageOrClickEvent === 'rage_click') {
        sendEvent({
          type: 'rage_click',
          element,
          page,
        });
        return; // STOP - don't measure dead click for rage patterns
      }

      // ========== PRIORITY 2 & 3: DEAD CLICK OR CLICK ==========
      // rageOrClickEvent === 'click'
      // For interactive elements, delay sending by 400ms to check for dead_click.
      // This ensures we send ONLY dead_click if element is unresponsive,
      // otherwise send regular click.
      if (isInteractiveElement(event.target as Element)) {
        let deadClickEventSent = false;

        // Start monitoring: will send dead_click if element doesn't respond within 400ms
        startDeadClickMonitoring(
          event.target as Element,
          element,
          page,
          (deadElement, deadPage) => {
            // Dead click detected! Send it instead of regular click
            deadClickEventSent = true;
            sendEvent({
              type: 'dead_click',
              element: deadElement,
              page: deadPage,
            });
          }
        );

        // After 400ms, if dead click wasn't sent, send regular click
        // This creates the 400ms delay for all clicks, ensuring we detect
        // dead clicks before committing to regular click events.
        const timeoutId = setTimeout(() => {
          if (!deadClickEventSent) {
            // Element was responsive or navigation occurred
            sendEvent({
              type: 'click',
              element,
              page,
            });
          }
        }, 400); // Matches DEAD_CLICK_TIMEOUT_MS
      } else {
        // Non-interactive element: send click immediately
        // (no need to wait for dead click measurement)
        sendEvent({
          type: 'click',
          element,
          page,
        });
      }
    };

    document.addEventListener('click', handleClick, true);

    // Handle navigation - cancel all pending dead clicks
    const handleNavigation = () => {
      cancelAllDeadClickMonitoring();
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
    };
  }, []);

  return null;
}
