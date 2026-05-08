/**
 * Event Buffer
 *
 * Maintains a rolling in-memory buffer of recent tracking events.
 * Used to attach context (previous_events) to rage_click and dead_click events.
 *
 * - Module-level singleton — shared across ClickTracker and NavigationTracker
 * - Max 10 events, FIFO eviction
 * - Shallow copies on read to avoid mutation
 */

const MAX_BUFFER_SIZE = 10;

export interface BufferedEvent {
  type: string;
  element?: string;
  page: string;
  timestamp: number;
}

const buffer: BufferedEvent[] = [];

/**
 * Push a new event into the buffer.
 * If the buffer exceeds MAX_BUFFER_SIZE, the oldest event is removed.
 * Call this BEFORE sending the event so context reflects the state
 * up to (but not including) the current event.
 */
export function pushEvent(event: BufferedEvent): void {
  buffer.push(event);
  if (buffer.length > MAX_BUFFER_SIZE) {
    buffer.shift();
  }
}

/**
 * Get a shallow copy of the current buffer contents.
 * Returns a new array — safe to attach to payloads without risking mutation.
 */
export function getBufferedEvents(): BufferedEvent[] {
  return buffer.slice();
}

/**
 * Get filtered buffer events: only include "click" and "navigation" events.
 * Excludes "dead_click" and "rage_click" to prevent context pollution.
 * 
 * Used when attaching context to rage_click and dead_click events.
 * Clean context shows only successful and navigational events, giving
 * better signal for analyzing what led to the failure.
 */
export function getFilteredBufferedEvents(): BufferedEvent[] {
  return buffer
    .filter((event) => event.type === 'click' || event.type === 'navigation')
    .slice(); // Shallow copy to prevent mutation
}

/**
 * Clear the buffer. Call on session reset or hard navigation if needed.
 */
export function clearBuffer(): void {
  buffer.length = 0;
}
