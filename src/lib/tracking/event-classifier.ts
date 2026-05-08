/**
 * EventClassifier - DEPRECATED
 *
 * This module was replaced by direct event sending in ClickTracker and
 * NavigationTracker with thin coordination (cancelPendingClick).
 *
 * The singleton classifier approach caused fundamental issues:
 * - Shared 400ms window let navigation always win over clicks
 * - Rage click didn't clear pending candidates
 * - Dead click raced with window timeout causing duplicates
 *
 * Kept for reference only. No code imports this module.
 */

export {};
