/**
 * Rage Click Detector - Two-Phase Cooldown
 * 
 * Phase 1 (Hard Suppression): Complete blackout
 *   - Duration: 1.5 seconds
 *   - Returns: null (no events sent, no detection)
 * 
 * Phase 2 (Recovery): Allow clicks, prevent rage re-detection
 *   - Duration: 2 seconds (additional, after Phase 1)
 *   - Returns: 'click' only (no rage detection possible)
 * 
 * Total cooldown: 3.5 seconds
 * 
 * Result: rage_click → [suppressed 1.5s] → click → click → click → [recovery 2s] → back to normal
 *         Prevents: rage_click → click → click → rage_click
 */

const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 1000; // Detection window: 1 second
const RAGE_HARD_SUPPRESSION_MS = 1500; // Phase 1: Complete blackout (1.5s)
const RAGE_RECOVERY_MS = 2000; // Phase 2: Recovery, no rage detection (2s)
const RAGE_TOTAL_COOLDOWN_MS = RAGE_HARD_SUPPRESSION_MS + RAGE_RECOVERY_MS; // 3.5s total

interface ClickRecord {
  element: string;
  timestamp: number;
}

// Sliding window of recent clicks (only for non-suppressed elements)
const recentClicks: ClickRecord[] = [];

// Phase 1: Hard suppression - element is completely ignored
// element -> expiry timestamp when suppression ends
const hardSuppression = new Map<string, number>();

// Phase 2: Recovery - rage detection is disabled but normal clicks allowed
// element -> expiry timestamp when recovery ends
const recoveryWindow = new Map<string, number>();

/**
 * Detect rage click and return what event (if any) should be sent
 * 
 * Returns:
 * - 'rage_click': Send a rage_click event, start 3.5s cooldown
 * - 'click': Send a regular click event (normal or recovery mode)
 * - null: Suppress this click (hard suppression phase, nothing sent)
 */
export function detectRageClick(element: string, currentTime: number): 'rage_click' | 'click' | null {
  // ========== PHASE 1: HARD SUPPRESSION ==========
  // Complete blackout - don't process this element at all
  const suppressUntil = hardSuppression.get(element);
  if (suppressUntil !== undefined && currentTime < suppressUntil) {
    // Still in hard suppression, silently drop this click (don't track it)
    return null;
  }

  // Hard suppression window expired, clean it up
  if (suppressUntil !== undefined && currentTime >= suppressUntil) {
    hardSuppression.delete(element);
  }

  // ========== PHASE 2: RECOVERY WINDOW ==========
  // Rage detection disabled, but normal clicks allowed
  const recoveryUntil = recoveryWindow.get(element);
  if (recoveryUntil !== undefined && currentTime < recoveryUntil) {
    // In recovery phase - allow click but disable rage detection
    // Don't track this click for rage detection
    // Just send a normal click event
    return 'click';
  }

  // Recovery window expired, clean it up
  if (recoveryUntil !== undefined && currentTime >= recoveryUntil) {
    recoveryWindow.delete(element);
  }

  // ========== NORMAL DETECTION PHASE ==========
  // Remove clicks older than the detection window
  while (recentClicks.length > 0 && currentTime - recentClicks[0].timestamp > RAGE_CLICK_WINDOW_MS) {
    recentClicks.shift();
  }

  // Add current click to the tracking window
  recentClicks.push({ element, timestamp: currentTime });

  // Count how many times this element was clicked in the current window
  const clicksForElement = recentClicks.filter(
    (click) => click.element === element
  ).length;

  // Check if we have a rage click pattern (3+ clicks in 1 second)
  if (clicksForElement >= RAGE_CLICK_THRESHOLD) {
    // Rage detected! Start the 3.5-second cooldown
    const suppressUntilTime = currentTime + RAGE_HARD_SUPPRESSION_MS;
    const recoveryUntilTime = suppressUntilTime + RAGE_RECOVERY_MS;

    hardSuppression.set(element, suppressUntilTime);
    recoveryWindow.set(element, recoveryUntilTime);

    // Clean up the recent clicks for this element
    // Keep only clicks from OTHER elements
    const otherElementClicks = recentClicks.filter((click) => click.element !== element);
    recentClicks.length = 0;
    recentClicks.push(...otherElementClicks);

    return 'rage_click';
  }

  // No rage pattern detected, send a regular click event
  return 'click';
}

/**
 * Get debug info about current state
 */
export function getDebugInfo() {
  const now = Date.now();
  return {
    recentClicksCount: recentClicks.length,
    clicksByElement: Object.fromEntries(
      Array.from(
        new Map(
          recentClicks.map((click) => [
            click.element,
            recentClicks.filter((c) => c.element === click.element).length,
          ])
        ).entries()
      )
    ),
    hardSuppressedElements: Array.from(hardSuppression.entries()).map(([elem, until]) => ({
      element: elem,
      suppressedFor: Math.max(0, until - now) + 'ms',
    })),
    recoveryElements: Array.from(recoveryWindow.entries()).map(([elem, until]) => ({
      element: elem,
      recoveryFor: Math.max(0, until - now) + 'ms',
    })),
  };
}

/**
 * Clear all cooldown tracking (useful for testing)
 */
export function clearCooldowns(): void {
  hardSuppression.clear();
  recoveryWindow.clear();
}

/**
 * Clear all state including click history (useful for cleanup)
 */
export function clearAll(): void {
  recentClicks.length = 0;
  hardSuppression.clear();
  recoveryWindow.clear();
}
