/**
 * Dead Click Detector - Refined Implementation
 * 
 * Detects clicks on interactive elements that don't trigger any response.
 * Monitors for:
 * - DOM mutations (global document observation)
 * - Navigation
 * - User interactions
 * - Rage click cooldown
 * 
 * Uses stable element keys (data-testid, data-qa, id, or position-based)
 * instead of mutable selector strings.
 * 
 * Key improvements:
 * - Walks up 2-3 parent levels to find interactive ancestors
 * - Generates stable element keys that survive DOM changes
 * - 400ms detection window (increased from 350ms)
 * - 1.5s cooldown per element (tighter than 2.0s)
 * 
 * Only sends dead_click event if NONE of above occur within 400ms.
 */

const DEAD_CLICK_TIMEOUT_MS = 400; // Increased from 350ms
const DEAD_CLICK_COOLDOWN_MS = 1500; // Refined from 2000ms (1.5s)

interface PendingDeadClick {
  stableKey: string;
  displaySelector: string;
  page: string;
  timeoutId: NodeJS.Timeout;
}

// Track pending dead clicks (stable key -> data)
const pendingDeadClicks = new Map<string, PendingDeadClick>();

// Track dead click cooldown to avoid duplicates (stable key -> expiry timestamp)
const deadClickCooldown = new Map<string, number>();

/**
 * Generate a stable element key that persists across DOM operations.
 * 
 * Strategy (in order of preference):
 * 1. data-testid attribute (most stable, explicitly set for testing)
 * 2. data-qa attribute (QA-specific identifier)
 * 3. #id attribute (HTML id, relatively stable)
 * 4. Position-based key: `pos:{tagName}_{childIndex}_{ancestorPath}`
 *    (fallback for generic elements; position within parent)
 * 
 * Position-based example: "pos:button_2_0_1" = 3rd button child, ancestor positions
 */
export function getStableElementKey(element: Element): string {
  // Attempt 1: data-testid (most stable, explicitly set)
  const testId = element.getAttribute('data-testid');
  if (testId) {
    return `testid:${testId}`;
  }

  // Attempt 2: data-qa (QA-specific identifier)
  const qaId = element.getAttribute('data-qa');
  if (qaId) {
    return `qa:${qaId}`;
  }

  // Attempt 3: HTML id
  if (element.id) {
    return `id:${element.id}`;
  }

  // Fallback: Position-based key
  // Represents: element's position within parent + parent's position within grandparent
  let current = element;
  const path: number[] = [];

  // Walk up 2 levels to build position path (max 3 levels deep)
  for (let i = 0; i < 3 && current.parentElement; i++) {
    const parent = current.parentElement;
    const index = Array.from(parent.children).indexOf(current);
    path.unshift(index);
    current = parent;
  }

  const tagName = element.tagName.toLowerCase();
  return `pos:${tagName}_${path.join('_')}`;
}

/**
 * Check if an element is interactive, including up to 2-3 parent levels.
 * 
 * Algorithm:
 * 1. Check the element itself for interactive markers
 * 2. If not interactive, walk up 2-3 parent levels
 * 3. If any parent is interactive, return true + log parent walkup
 * 4. If no interactive ancestor found, return false + log skip
 */
function isInteractiveElementOrAncestor(element: Element): boolean {
  // Check the element itself
  if (isDirectlyInteractive(element)) {
    return true;
  }

  // Walk up 2-3 parent levels looking for interactive ancestor
  let current = element.parentElement;
  for (let level = 1; level <= 3 && current; level++) {
    if (isDirectlyInteractive(current)) {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug(
          `[DeadClickDetector] Parent walkup found interactive ancestor at level ${level}:`,
          current
        );
      }
      return true;
    }
    current = current.parentElement;
  }

  // No interactive ancestor found
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(
      '[DeadClickDetector] Skipped non-interactive element (no interactive ancestors):',
      element.tagName.toLowerCase(),
      element
    );
  }
  return false;
}

/**
 * Check if an element has direct interactive markers (doesn't walk parents)
 */
function isDirectlyInteractive(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();

  // Direct interactive tags
  if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
    return true;
  }

  // ARIA button role
  if (element.getAttribute('role') === 'button') {
    return true;
  }

  // onclick handler
  if (element.hasAttribute('onclick') || (element as any).onclick !== null) {
    return true;
  }

  // cursor: pointer style (common for custom interactive elements)
  const style = window.getComputedStyle(element);
  if (style.cursor === 'pointer') {
    return true;
  }

  return false;
}

/**
 * Public API: Detect if element or its ancestors are interactive.\n * Used by ClickTracker to determine if dead click monitoring should start.
 */
export function isInteractiveElement(element: Element): boolean {
  return isInteractiveElementOrAncestor(element);
}

/**
 * Start monitoring a click for dead click condition.
 * 
 * @param element - The DOM element that was clicked (from event.target or similar)
 * @param displaySelector - Selector string for logging/display only (not used for tracking)
 * @param page - Current page string (pathname + search + hash)
 * @param onDeadClick - Callback when dead_click event should be sent
 * @returns Cleanup function to cancel monitoring
 */
export function startDeadClickMonitoring(
  element: Element,
  displaySelector: string,
  page: string,
  onDeadClick: (displaySelector: string, page: string) => void
): () => void {
  // Generate stable key for this element (independent of DOM mutations)
  const stableKey = getStableElementKey(element);

  // If already being tracked, cancel old one
  cancelDeadClickMonitoring(stableKey);

  // Check cooldown (prevent duplicate dead_click events within 1.5s)
  const cooldownUntil = deadClickCooldown.get(stableKey);
  if (cooldownUntil !== undefined && Date.now() < cooldownUntil) {
    // Still in cooldown, don't start new monitoring
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(
        `[DeadClickDetector] Cooldown active for key: ${stableKey}, ignoring`,
        {
          remainingMs: cooldownUntil - Date.now(),
        }
      );
    }
    return () => {};
  }

  // Set up mutation observer to detect DOM changes (global document observation)
  let mutationDetected = false;
  const observer = new MutationObserver(() => {
    mutationDetected = true;
    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`[DeadClickDetector] Mutation detected for key: ${stableKey}`);
    }
    cancelDeadClickMonitoring(stableKey);
  });

  // Start observing for mutations - global scope (document.body with subtree)
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[DeadClickDetector] Monitoring started for key: ${stableKey}`, {
      displaySelector,
      page,
      timeoutMs: DEAD_CLICK_TIMEOUT_MS,
    });
  }

  // Set up timeout for dead click detection (400ms window)
  const timeoutId = setTimeout(() => {
    if (!mutationDetected && pendingDeadClicks.has(stableKey)) {
      // No mutations, no nav, no interactions → dead click!
      observer.disconnect();
      pendingDeadClicks.delete(stableKey);

      // Set cooldown to prevent duplicate dead_click events (1.5s cooldown)
      deadClickCooldown.set(stableKey, Date.now() + DEAD_CLICK_COOLDOWN_MS);

      if (typeof console !== 'undefined' && console.debug) {
        console.debug(`[DeadClickDetector] Dead click detected for key: ${stableKey}`, {
          displaySelector,
          page,
        });
      }

      // Send the event (use displaySelector for backwards compatibility with API)
      onDeadClick(displaySelector, page);
    }
  }, DEAD_CLICK_TIMEOUT_MS);

  const pending: PendingDeadClick = { stableKey, displaySelector, page, timeoutId };
  pendingDeadClicks.set(stableKey, pending);

  // Return cleanup function
  return () => {
    observer.disconnect();
    mutationDetected = true;
    cancelDeadClickMonitoring(stableKey);
  };
}

/**
 * Cancel dead click monitoring for an element by stable key
 * Call this when something DOES happen (nav, interaction, etc.)
 */
export function cancelDeadClickMonitoring(stableKeyOrOldElement: string): void {
  const pending = pendingDeadClicks.get(stableKeyOrOldElement);
  if (pending) {
    clearTimeout(pending.timeoutId);
    pendingDeadClicks.delete(stableKeyOrOldElement);
  }
}

/**
 * Cancel all pending dead click monitors
 * Call this on page navigation
 */
export function cancelAllDeadClickMonitoring(): void {
  pendingDeadClicks.forEach((pending) => {
    clearTimeout(pending.timeoutId);
  });
  pendingDeadClicks.clear();
}

/**
 * Get debug info for monitoring and testing
 */
export function getDebugInfo() {
  const now = Date.now();
  const cooldownArray: Array<{ stableKey: string; cooldownRemainingMs: number }> = [];
  
  deadClickCooldown.forEach((until, key) => {
    cooldownArray.push({
      stableKey: key,
      cooldownRemainingMs: Math.max(0, until - now),
    });
  });

  return {
    pendingDeadClicksCount: pendingDeadClicks.size,
    pendingElements: Array.from(pendingDeadClicks.values()).map((p) => ({
      stableKey: p.stableKey,
      displaySelector: p.displaySelector,
    })),
    cooldownElements: cooldownArray,
    detectionWindowMs: DEAD_CLICK_TIMEOUT_MS,
    cooldownMs: DEAD_CLICK_COOLDOWN_MS,
  };
}
