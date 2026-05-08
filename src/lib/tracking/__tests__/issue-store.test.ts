import { recordIssue, getIssues, clearIssueStore, getIssueCount, getLastUpdateTime, type StoredIssue } from '../issue-store';
import type { StructuredIssue } from '../context-builder';

describe('issue-store', () => {
  beforeEach(() => {
    clearIssueStore();
  });

  describe('recordIssue', () => {
    it('adds a new issue to the store', () => {
      const issue: StructuredIssue = {
        issue_type: 'User Frustration',
        severity: 'high',
        summary: 'User repeatedly clicked',
        page: '/checkout',
        element: 'button.submit',
        steps_to_reproduce: ['Click on Submit button'],
        signature: 'rage_click|/checkout|button.submit',
        frequency: 1,
      };

      recordIssue(issue, 'session-123');

      expect(getIssueCount()).toBe(1);
      const stored = getIssues()[0];
      expect(stored.signature).toBe(issue.signature);
      expect(stored.session_id).toBe('session-123');
      expect(stored.frequency).toBe(1);
    });

    it('increments frequency on duplicate signature', () => {
      const issue: StructuredIssue = {
        issue_type: 'Broken Interaction',
        severity: 'medium',
        summary: 'Element not responding',
        page: '/form',
        element: 'input[data-testid="email"]',
        steps_to_reproduce: [],
        signature: 'dead_click|/form|input[data-testid="email"]',
        frequency: 1,
      };

      recordIssue(issue, 'session-1');
      recordIssue(issue, 'session-2');

      expect(getIssueCount()).toBe(1);
      const stored = getIssues()[0];
      expect(stored.frequency).toBe(2);
      expect(stored.last_seen).toBeDefined();
    });

    it('updates last_seen on deduplication', () => {
      const issue: StructuredIssue = {
        issue_type: 'User Frustration',
        severity: 'high',
        summary: 'Test',
        page: '/test',
        element: 'button',
        steps_to_reproduce: [],
        signature: 'rage_click|/test|button',
        frequency: 1,
      };

      recordIssue(issue, 'session-a');
      const firstStored = getIssues()[0];
      expect(firstStored.last_seen).toBeUndefined();

      recordIssue(issue, 'session-b');
      const secondStored = getIssues()[0];
      expect(secondStored.last_seen).toBeDefined();
    });
  });

  describe('getIssues', () => {
    it('sorts by severity by default', () => {
      const highSeverity: StructuredIssue = {
        issue_type: 'User Frustration',
        severity: 'high',
        summary: 'High severity issue',
        page: '/page',
        element: 'button',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|button',
        frequency: 1,
      };

      const lowSeverity: StructuredIssue = {
        issue_type: 'Broken Interaction',
        severity: 'low',
        summary: 'Low severity issue',
        page: '/page',
        element: 'link',
        steps_to_reproduce: [],
        signature: 'dead_click|/page|link',
        frequency: 1,
      };

      recordIssue(lowSeverity);
      recordIssue(highSeverity);

      const issues = getIssues();
      expect(issues[0].severity).toBe('high');
      expect(issues[1].severity).toBe('low');
    });

    it('sorts by frequency when specified', () => {
      const issue1: StructuredIssue = {
        issue_type: 'Issue 1',
        severity: 'high',
        summary: 'Issue 1',
        page: '/page',
        element: 'a',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|a',
        frequency: 1,
      };

      const issue2: StructuredIssue = {
        issue_type: 'Issue 2',
        severity: 'high',
        summary: 'Issue 2',
        page: '/page',
        element: 'b',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|b',
        frequency: 1,
      };

      recordIssue(issue1);
      recordIssue(issue2);
      recordIssue(issue2);

      const issues = getIssues('frequency');
      expect(issues[0].signature).toBe(issue2.signature);
      expect(issues[0].frequency).toBe(2);
    });

    it('returns all issues when retrieved', () => {
      const issue1: StructuredIssue = {
        issue_type: 'Issue 1',
        severity: 'low',
        summary: 'Issue 1',
        page: '/page',
        element: 'a',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|a',
        frequency: 1,
      };

      const issue2: StructuredIssue = {
        issue_type: 'Issue 2',
        severity: 'low',
        summary: 'Issue 2',
        page: '/page',
        element: 'b',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|b',
        frequency: 1,
      };

      recordIssue(issue1);
      recordIssue(issue2);

      const issues = getIssues();
      expect(issues.length).toBe(2);
    });

    it('returns empty array when store is empty', () => {
      expect(getIssues()).toEqual([]);
    });
  });

  describe('getIssueCount', () => {
    it('returns 0 for empty store', () => {
      expect(getIssueCount()).toBe(0);
    });

    it('returns count of unique signatures', () => {
      const issue: StructuredIssue = {
        issue_type: 'Test',
        severity: 'medium',
        summary: 'Test',
        page: '/page',
        element: 'button',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|button',
        frequency: 1,
      };

      recordIssue(issue);
      recordIssue(issue);
      recordIssue(issue);

      expect(getIssueCount()).toBe(1);
    });
  });

  describe('getLastUpdateTime', () => {
    it('returns undefined for empty store', () => {
      expect(getLastUpdateTime()).toBeUndefined();
    });

    it('returns most recent timestamp', () => {
      const issue1: StructuredIssue = {
        issue_type: 'Issue 1',
        severity: 'low',
        summary: 'Issue 1',
        page: '/page',
        element: 'a',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|a',
        frequency: 1,
      };

      const issue2: StructuredIssue = {
        issue_type: 'Issue 2',
        severity: 'low',
        summary: 'Issue 2',
        page: '/page',
        element: 'b',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|b',
        frequency: 1,
      };

      recordIssue(issue1);
      recordIssue(issue2);

      const lastTime = getLastUpdateTime();
      expect(lastTime).toBeDefined();
      expect(lastTime!.getTime()).toBeGreaterThanOrEqual(new Date().getTime() - 100);
    });
  });

  describe('clearIssueStore', () => {
    it('removes all issues', () => {
      const issue: StructuredIssue = {
        issue_type: 'Test',
        severity: 'low',
        summary: 'Test',
        page: '/page',
        element: 'button',
        steps_to_reproduce: [],
        signature: 'rage_click|/page|button',
        frequency: 1,
      };

      recordIssue(issue);
      expect(getIssueCount()).toBe(1);

      clearIssueStore();
      expect(getIssueCount()).toBe(0);
      expect(getIssues()).toEqual([]);
    });
  });
});
