/**
 * Context Builder
 *
 * Transforms rage_click and dead_click events into structured issue objects.
 * Pure functions — no side effects, no AI, fully deterministic.
 *
 * Uses previous_events context (already filtered to click + navigation)
 * to generate human-readable steps-to-reproduce.
 *
 * Design decisions:
 * - Only interactive elements (button, a, input, select, textarea) generate issues.
 * - rage_click always produces a generic frustration message.
 * - dead_click summary includes semantic value (data-testid, aria-label, class) if present.
 * - Utility CSS classes (Tailwind, Bootstrap) are filtered out of summaries.
 */

import type { BufferedEvent } from './event-buffer';

// ─── Types ───────────────────────────────────────────────────────────

export interface EventInput {
  type: string;
  element?: string;
  page: string;
  session_id?: string;
  previous_events?: BufferedEvent[];
}

export type Severity = 'low' | 'medium' | 'high';

export interface StructuredIssue {
  issue_type: string;
  severity: Severity;
  summary: string;
  page: string;
  element: string;
  steps_to_reproduce: string[];
  signature: string;
  frequency: number;
  sessions_affected?: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const ISSUE_CONFIG: Record<string, { issue_type: string; severity: Severity; action: string }> = {
  dead_click: {
    issue_type: 'Broken Interaction',
    severity: 'medium',
    action: 'Nothing happens',
  },
  rage_click: {
    issue_type: 'User Frustration',
    severity: 'high',
    action: 'User clicks multiple times',
  },
};

// ─── Issue frequency store ─────────────────────────────────────────

/** Persistent in-memory frequency tracker keyed by issue signature. */
const issueFrequencyStore = new Map<string, number>();

/** Reset the frequency store. Call between tests or on session boundary. */
export function clearIssueFrequencyStore(): void {
  issueFrequencyStore.clear();
}

// ─── Interactive element detection ───────────────────────────────────

const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea']);

/**
 * Returns true if the CSS selector targets an element expected to respond
 * to user interaction.
 *
 * Interactive when:
 *  - Tag is one of: button, a, input, select, textarea
 *  - Selector contains data-testid (explicitly marked as testable)
 *  - Selector contains role="button"
 */
function isInteractiveSelector(selector: string): boolean {
  if (!selector || selector === 'unknown') return false;
  if (selector.includes('data-testid')) return true;
  if (selector.includes('role="button"')) return true;
  const lastSegment = selector.split('>').map((s) => s.trim()).pop()!;
  const tagMatch = lastSegment.match(/^(\w+)/);
  return tagMatch ? INTERACTIVE_TAGS.has(tagMatch[1].toLowerCase()) : false;
}

/** Tags that map to friendlier display names */
const TAG_DISPLAY: Record<string, string> = {
  a: 'link',
  img: 'image',
  input: 'input',
  textarea: 'textarea',
  select: 'dropdown',
  button: 'button',
  div: 'element',
  span: 'element',
  li: 'list item',
  td: 'table cell',
  th: 'table header',
};

// ─── Helpers ─────────────────────────────────────────────────────────

function titleCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function tagDisplayName(tag: string): string {
  const lower = tag.toLowerCase();
  return TAG_DISPLAY[lower] || lower;
}

/**
 * Build the issue summary string.
 * Both types use fixed, human-readable messages that avoid raw CSS selectors.
 */
function generateSummary(eventType: string): string {
  if (eventType === 'rage_click') {
    return 'User repeatedly clicked on an unresponsive element';
  }
  return 'Interactive element not responding';
}

// ─── formatElement ───────────────────────────────────────────────────

/**
 * Convert a CSS selector (from getClickSelector) into human-readable text.
 *
 * Handles these patterns produced by get-click-selector.ts:
 *   tag[data-testid="value"]   → "Value button"
 *   tag[aria-label="value"]    → "Value link"
 *   #id                        → "Id element"
 *   tag.class1.class2          → "Class1 button"
 *   tag:nth-of-type(n) > ...   → "Button element" (deepest tag)
 *   unknown                    → "Unknown element"
 */
export function formatElement(selector: string | undefined): string {
  if (!selector || selector === 'unknown') {
    return 'Unknown element';
  }

  // Pattern 1: tag[attr="value"]  (data-testid, aria-label, data-qa, etc.)
  const attrMatch = selector.match(/^(\w+)\[[\w-]+="(.+?)"\]$/);
  if (attrMatch) {
    const tag = attrMatch[1];
    const value = attrMatch[2];
    // Unescape any CSS-escaped characters
    const clean = value.replace(/\\(.)/g, '$1');
    return `${titleCase(clean)} ${tagDisplayName(tag)}`;
  }

  // Pattern 2: #id
  const idMatch = selector.match(/^#(.+)$/);
  if (idMatch) {
    const id = idMatch[1].replace(/\\(.)/g, '$1');
    return `${titleCase(id)} element`;
  }

  // Pattern 3: tag.class1.class2
  const classMatch = selector.match(/^(\w+)\.(.+)$/);
  if (classMatch) {
    const tag = classMatch[1];
    const firstClass = classMatch[2].split('.')[0].replace(/\\(.)/g, '$1');
    return `${titleCase(firstClass)} ${tagDisplayName(tag)}`;
  }

  // Pattern 4: nth-of-type chain  (e.g. div:nth-of-type(2) > button:nth-of-type(1))
  if (selector.includes(':nth-of-type')) {
    const segments = selector.split('>').map((s) => s.trim());
    const last = segments[segments.length - 1];
    const tagFromNth = last.match(/^(\w+)/);
    if (tagFromNth) {
      return `${titleCase(tagFromNth[1])} element`;
    }
  }

  // Fallback — return raw selector capitalised
  return `${titleCase(selector)} element`;
}

// ─── generateSteps ───────────────────────────────────────────────────

/**
 * Build a human-readable steps-to-reproduce array from previous_events
 * and the current event context.
 *
 * previous_events is already filtered to "click" + "navigation" only.
 */
export function generateSteps(
  previousEvents: BufferedEvent[] | undefined,
  currentEventType: string,
  currentElement?: string,
): string[] {
  const steps: string[] = [];

  if (previousEvents && previousEvents.length > 0) {
    for (const evt of previousEvents) {
      if (evt.type === 'navigation') {
        steps.push(`Navigate to ${evt.page}`);
      } else if (evt.type === 'click' && evt.element && evt.element !== 'unknown') {
        steps.push(`Click on ${formatElement(evt.element)}`);
      }
    }
  }

  // Final step — what the user experienced
  const config = ISSUE_CONFIG[currentEventType];
  if (config) {
    steps.push(`Click on ${formatElement(currentElement)} — ${config.action}`);
  }

  return steps;
}

// ─── buildIssue ──────────────────────────────────────────────────────

/**
 * Transform a rage_click or dead_click event into a structured issue.
 * Returns null if:
 * - Event type is not rage_click or dead_click
 * - No element selector present
 */
export function buildIssue(event: EventInput): StructuredIssue | null {
  const config = ISSUE_CONFIG[event.type];
  if (!config) {
    return null;
  }

  // Require at least an element identifier to build a meaningful issue
  if (!event.element) {
    return null;
  }

  // Only interactive elements generate issues
  if (!isInteractiveSelector(event.element)) {
    return null;
  }

  const element = event.element;
  const summary = generateSummary(event.type);
  const signature = `${event.type}|${event.page}|${event.element}`;
  const prevCount = issueFrequencyStore.get(signature) ?? 0;
  const frequency = prevCount + 1;
  issueFrequencyStore.set(signature, frequency);

  // Filter previous_events to click + navigation only (removes rage_click / dead_click noise).
  // Fall back to the original array if filtering would leave it empty.
  const filtered = event.previous_events?.filter(
    (e) => e.type === 'click' || e.type === 'navigation'
  );
  const contextEvents = filtered && filtered.length > 0 ? filtered : event.previous_events;

  return {
    issue_type: config.issue_type,
    severity: config.severity,
    summary,
    page: event.page,
    element,
    steps_to_reproduce: generateSteps(contextEvents, event.type, event.element),
    signature,
    frequency,
  };
}
