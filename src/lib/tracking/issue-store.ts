/**
 * Issue Store
 *
 * In-memory storage for structured issues with deduplication.
 * Issues are keyed by signature (type|page|element) — same signature = same issue.
 * Frequency increments on duplicates; last_seen timestamp updates.
 */

import type { StructuredIssue } from './context-builder';

// ─── Types ───────────────────────────────────────────────────────────

export interface StoredIssue extends StructuredIssue {
  session_id?: string;
  timestamp: Date;
  last_seen?: Date;
}

type SortOrder = 'severity' | 'frequency' | 'timestamp';

// ─── Module-level store ───────────────────────────────────────────────

const issueStore = new Map<string, StoredIssue>();

// ─── Public API ──────────────────────────────────────────────────────

/**
 * Record a structured issue in the store.
 *
 * If signature already exists:
 *   - Increment frequency
 *   - Update last_seen
 * If new:
 *   - Add with frequency and timestamp
 */
export function recordIssue(issue: StructuredIssue, sessionId?: string): void {
  const signature = issue.signature;

  if (issueStore.has(signature)) {
    const existing = issueStore.get(signature)!;
    existing.frequency += 1;
    existing.last_seen = new Date();
  } else {
    const stored: StoredIssue = {
      ...issue,
      session_id: sessionId,
      timestamp: new Date(),
    };
    issueStore.set(signature, stored);
  }
}

/**
 * Get all issues, optionally sorted by criteria.
 *
 * Default sort order (when sortBy is omitted or invalid):
 *  1. Severity (high → medium → low)
 *  2. Frequency (highest first)
 *  3. Timestamp (newest first)
 */
export function getIssues(sortBy?: SortOrder): StoredIssue[] {
  const issues = Array.from(issueStore.values());

  if (sortBy === 'frequency') {
    return issues.sort((a, b) => {
      if (b.frequency !== a.frequency) return b.frequency - a.frequency;
      return severityScore(b.severity) - severityScore(a.severity);
    });
  }

  if (sortBy === 'timestamp') {
    return issues.sort((a, b) => {
      const aTime = (a.last_seen ?? a.timestamp).getTime();
      const bTime = (b.last_seen ?? b.timestamp).getTime();
      return bTime - aTime;
    });
  }

  // Default: severity → frequency → timestamp
  return issues.sort((a, b) => {
    const severityDiff = severityScore(b.severity) - severityScore(a.severity);
    if (severityDiff !== 0) return severityDiff;

    const freqDiff = b.frequency - a.frequency;
    if (freqDiff !== 0) return freqDiff;

    const aTime = (a.last_seen ?? a.timestamp).getTime();
    const bTime = (b.last_seen ?? b.timestamp).getTime();
    return bTime - aTime;
  });
}

/**
 * Clear all issues from the store.
 * Useful for test cleanup and session resets.
 */
export function clearIssueStore(): void {
  issueStore.clear();
}

/**
 * Get the count of stored issues.
 */
export function getIssueCount(): number {
  return issueStore.size;
}

/**
 * Get the timestamp of the most recent issue update.
 * Returns undefined if no issues.
 */
export function getLastUpdateTime(): Date | undefined {
  if (issueStore.size === 0) return undefined;

  let latest = new Date(0);
  const values = Array.from(issueStore.values());
  for (let i = 0; i < values.length; i += 1) {
    const issue = values[i];
    const time = (issue.last_seen ?? issue.timestamp).getTime();
    if (time > latest.getTime()) {
      latest = new Date(time);
    }
  }
  return latest;
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Return numeric score for severity (higher = more severe).
 * Used for sorting.
 */
function severityScore(severity: string): number {
  switch (severity) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}
