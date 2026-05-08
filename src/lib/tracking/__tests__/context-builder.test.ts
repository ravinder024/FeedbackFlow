import {
  formatElement,
  generateSteps,
  buildIssue,
  clearIssueFrequencyStore,
  type EventInput,
  type StructuredIssue,
} from '../context-builder';
import type { BufferedEvent } from '../event-buffer';

beforeEach(() => {
  clearIssueFrequencyStore();
});

// ─── formatElement ───────────────────────────────────────────────────

describe('formatElement', () => {
  it('handles data-testid selector', () => {
    expect(formatElement('button[data-testid="submit"]')).toBe('Submit button');
  });

  it('handles aria-label selector', () => {
    expect(formatElement('a[aria-label="Close dialog"]')).toBe('Close Dialog link');
  });

  it('handles data-qa selector', () => {
    expect(formatElement('input[data-qa="search-box"]')).toBe('Search Box input');
  });

  it('handles #id selector', () => {
    expect(formatElement('#checkout-btn')).toBe('Checkout Btn element');
  });

  it('handles tag.class selector', () => {
    expect(formatElement('button.submit.primary')).toBe('Submit button');
  });

  it('handles nth-of-type chain', () => {
    expect(formatElement('div:nth-of-type(2) > button:nth-of-type(1)')).toBe('Button element');
  });

  it('handles single nth-of-type', () => {
    expect(formatElement('li:nth-of-type(3)')).toBe('Li element');
  });

  it('returns "Unknown element" for undefined', () => {
    expect(formatElement(undefined)).toBe('Unknown element');
  });

  it('returns "Unknown element" for "unknown"', () => {
    expect(formatElement('unknown')).toBe('Unknown element');
  });

  it('falls back to raw selector for unrecognized patterns', () => {
    expect(formatElement('svg')).toBe('Svg element');
  });

  it('handles kebab-case class names', () => {
    expect(formatElement('button.nav-toggle')).toBe('Nav Toggle button');
  });

  it('handles underscore class names', () => {
    expect(formatElement('div.card_header')).toBe('Card Header element');
  });
});

// ─── generateSteps ───────────────────────────────────────────────────

describe('generateSteps', () => {
  const navEvent: BufferedEvent = { type: 'navigation', page: '/dashboard', timestamp: 1000 };
  const clickEvent: BufferedEvent = { type: 'click', element: 'button.submit', page: '/form', timestamp: 2000 };
  const clickEvent2: BufferedEvent = { type: 'click', element: 'a[aria-label="Home"]', page: '/dashboard', timestamp: 3000 };

  it('builds steps from mixed previous events for dead_click', () => {
    const steps = generateSteps([navEvent, clickEvent], 'dead_click', 'button.save');
    expect(steps).toEqual([
      'Navigate to /dashboard',
      'Click on Submit button',
      'Click on Save button — Nothing happens',
    ]);
  });

  it('builds steps from mixed previous events for rage_click', () => {
    const steps = generateSteps([navEvent, clickEvent], 'rage_click', 'button.submit');
    expect(steps).toEqual([
      'Navigate to /dashboard',
      'Click on Submit button',
      'Click on Submit button — User clicks multiple times',
    ]);
  });

  it('handles empty previous events', () => {
    const steps = generateSteps([], 'dead_click', 'button.ok');
    expect(steps).toEqual([
      'Click on Ok button — Nothing happens',
    ]);
  });

  it('handles undefined previous events', () => {
    const steps = generateSteps(undefined, 'rage_click', '#send-btn');
    expect(steps).toEqual([
      'Click on Send Btn element — User clicks multiple times',
    ]);
  });

  it('handles navigation-only context', () => {
    const navEvents: BufferedEvent[] = [
      { type: 'navigation', page: '/home', timestamp: 100 },
      { type: 'navigation', page: '/settings', timestamp: 200 },
    ];
    const steps = generateSteps(navEvents, 'dead_click', 'input[data-testid="email"]');
    expect(steps).toEqual([
      'Navigate to /home',
      'Navigate to /settings',
      'Click on Email input — Nothing happens',
    ]);
  });

  it('handles click-only context', () => {
    const steps = generateSteps([clickEvent, clickEvent2], 'rage_click', 'button.submit');
    expect(steps).toEqual([
      'Click on Submit button',
      'Click on Home link',
      'Click on Submit button — User clicks multiple times',
    ]);
  });

  it('returns empty array for unknown event type with no context', () => {
    const steps = generateSteps([], 'click');
    expect(steps).toEqual([]);
  });
});

// ─── buildIssue: Interactive Element Validation ─────────────────────

describe('buildIssue', () => {
  describe('interactive element validation', () => {
    it('generates issue for button (interactive)', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'button[data-testid="submit"]',
        page: '/checkout',
      };

      expect(buildIssue(event)).not.toBeNull();
    });

    it('generates issue for link (interactive)', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'a[href="#home"]',
        page: '/checkout',
      };

      expect(buildIssue(event)).not.toBeNull();
    });

    it('generates issue for input (interactive)', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'input[data-testid="search"]',
        page: '/checkout',
      };

      expect(buildIssue(event)).not.toBeNull();
    });

    it('returns null for non-interactive elements like div', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'div.container',
        page: '/checkout',
      };

      expect(buildIssue(event)).toBeNull();
    });

    it('returns null for non-interactive elements like p', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'p.text-lg',
        page: '/checkout',
      };

      expect(buildIssue(event)).toBeNull();
    });

    it('generates issue for h2 with data-testid (treated as interactive)', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'h2[data-testid="title"]',
        page: '/checkout',
      };

      expect(buildIssue(event)).not.toBeNull();
    });

    it('returns null for non-interactive elements like span', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'span.badge',
        page: '/checkout',
      };

      expect(buildIssue(event)).toBeNull();
    });
  });

  describe('dead_click issue generation', () => {
    it('transforms dead_click into Broken Interaction issue', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'button[data-testid="submit"]',
        page: '/checkout',
        session_id: 'abc-123',
      };

      const issue = buildIssue(event);

      expect(issue).toEqual({
        issue_type: 'Broken Interaction',
        severity: 'medium',
        summary: 'Interactive element not responding',
        page: '/checkout',
        element: 'button[data-testid="submit"]',
        steps_to_reproduce: [
          'Click on Submit button — Nothing happens',
        ],
        signature: 'dead_click|/checkout|button[data-testid="submit"]',
        frequency: 1,
      });
    });

    it('uses tag display name when no semantic classes', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'button.mt-2.p-4',
        page: '/page',
      };

      const issue = buildIssue(event);

      expect(issue!.summary).toBe('Interactive element not responding');
    });

    it('filters utility classes, includes semantic classes', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'button.checkout.primary.mt-2.p-4.text-lg',
        page: '/page',
      };

      const issue = buildIssue(event);

      // With simplified summary generation, all dead_click events use the same fixed message
      expect(issue!.summary).toBe('Interactive element not responding');
    });

    it('handles missing element gracefully', () => {
      const issue = buildIssue({ type: 'dead_click', page: '/broken' });

      expect(issue).toBeNull(); // No tag = not interactive enough
    });
  });

  describe('rage_click issue generation', () => {
    it('transforms rage_click into User Frustration issue', () => {
      const event: EventInput = {
        type: 'rage_click',
        element: 'button.submit',
        page: '/checkout',
        session_id: 'abc-123',
      };

      const issue = buildIssue(event);

      expect(issue).toEqual({
        issue_type: 'User Frustration',
        severity: 'high',
        summary: 'User repeatedly clicked on an unresponsive element',
        page: '/checkout',
        element: 'button.submit',
        steps_to_reproduce: [
          'Click on Submit button — User clicks multiple times',
        ],
        signature: 'rage_click|/checkout|button.submit',
        frequency: 1,
      });
    });

    it('increments frequency on repeated calls for same signature', () => {
      const event: EventInput = {
        type: 'rage_click',
        element: 'button.submit',
        page: '/checkout',
      };

      const first = buildIssue(event);
      const second = buildIssue(event);

      expect(first!.frequency).toBe(1);
      expect(second!.frequency).toBe(2);
    });

    it('uses generic summary for all interactive elements', () => {
      const linkEvent: EventInput = {
        type: 'rage_click',
        element: 'a.nav-link',
        page: '/page',
      };

      const inputEvent: EventInput = {
        type: 'rage_click',
        element: 'input[data-testid="search"]',
        page: '/page',
      };

      expect(buildIssue(linkEvent)!.summary).toBe('User repeatedly clicked on an unresponsive element');
      expect(buildIssue(inputEvent)!.summary).toBe('User repeatedly clicked on an unresponsive element');
    });

    it('generates issue for rage_click on interactive element', () => {
      const event: EventInput = {
        type: 'rage_click',
        element: 'button.clickable',
        page: '/page',
      };

      expect(buildIssue(event)).not.toBeNull();
      expect(buildIssue(event)!.summary).toBe('User repeatedly clicked on an unresponsive element');
    });
  });

  describe('event type filtering', () => {
    it('returns null for regular click events', () => {
      expect(buildIssue({ type: 'click', page: '/home', element: 'button.ok' })).toBeNull();
    });

    it('returns null for navigation events', () => {
      expect(buildIssue({ type: 'navigation', page: '/home' })).toBeNull();
    });

    it('returns null for unknown event types', () => {
      expect(buildIssue({ type: 'scroll', page: '/home', element: 'button' })).toBeNull();
    });
  });

  describe('element field preservation', () => {
    it('preserves raw selector in element field', () => {
      const event: EventInput = {
        type: 'dead_click',
        element: 'div:nth-of-type(2) > button:nth-of-type(1)',
        page: '/page',
      };

      const issue = buildIssue(event);

      // element keeps original selector for programmatic use
      expect(issue!.element).toBe('div:nth-of-type(2) > button:nth-of-type(1)');
      // summary is a fixed human-readable string
      expect(issue!.summary).toBe('Interactive element not responding');
    });
  });

  describe('context in steps', () => {
    it('includes previous_events in steps_to_reproduce', () => {
      const event: EventInput = {
        type: 'rage_click',
        element: 'button.checkout',
        page: '/cart',
        previous_events: [
          { type: 'navigation', page: '/products', timestamp: 1000 },
          { type: 'click', element: 'button[data-testid="add-to-cart"]', page: '/products', timestamp: 2000 },
          { type: 'navigation', page: '/cart', timestamp: 3000 },
        ],
      };

      const issue = buildIssue(event);

      expect(issue!.steps_to_reproduce).toEqual([
        'Navigate to /products',
        'Click on Add To Cart button',
        'Navigate to /cart',
        'Click on Checkout button — User clicks multiple times',
      ]);
    });
  });
});

// ─── Full pipeline ───────────────────────────────────────────────────

describe('full pipeline', () => {
  it('produces complete structured issue from rage_click with context', () => {
    const event: EventInput = {
      type: 'rage_click',
      element: 'button.submit',
      page: '/checkout',
      session_id: 'session-xyz',
      previous_events: [
        { type: 'navigation', page: '/checkout', timestamp: 1000 },
        { type: 'click', element: 'a[aria-label="Cart icon"]', page: '/shop', timestamp: 2000 },
      ],
    };

    const issue = buildIssue(event);

    expect(issue).toEqual<StructuredIssue>({
      issue_type: 'User Frustration',
      severity: 'high',
      summary: 'User repeatedly clicked on an unresponsive element',
      page: '/checkout',
      element: 'button.submit',
      steps_to_reproduce: [
        'Navigate to /checkout',
        'Click on Cart Icon link',
        'Click on Submit button — User clicks multiple times',
      ],
      signature: 'rage_click|/checkout|button.submit',
      frequency: 1,
    });
  });

  it('produces complete structured issue from dead_click with context', () => {
    const event: EventInput = {
      type: 'dead_click',
      element: 'input[data-testid="search"]',
      page: '/dashboard',
      session_id: 'session-abc',
      previous_events: [
        { type: 'navigation', page: '/home', timestamp: 100 },
        { type: 'navigation', page: '/dashboard', timestamp: 200 },
        { type: 'click', element: '#sidebar-toggle', page: '/dashboard', timestamp: 300 },
      ],
    };

    const issue = buildIssue(event);

    expect(issue).toEqual<StructuredIssue>({
      issue_type: 'Broken Interaction',
      severity: 'medium',
      summary: 'Interactive element not responding',
      page: '/dashboard',
      element: 'input[data-testid="search"]',
      steps_to_reproduce: [
        'Navigate to /home',
        'Navigate to /dashboard',
        'Click on Sidebar Toggle element',
        'Click on Search input — Nothing happens',
      ],
      signature: 'dead_click|/dashboard|input[data-testid="search"]',
      frequency: 1,
    });
  });

  it('generates issues for rage_click and dead_click on interactive elements', () => {
    const events = [
      { type: 'rage_click', element: 'button.large-action', page: '/page' },
      { type: 'dead_click', element: 'input[data-testid="email"]', page: '/page' },
      { type: 'dead_click', element: 'a[href="#submit"]', page: '/page' },
    ];

    events.forEach((event) => {
      expect(buildIssue(event)).not.toBeNull();
    });
  });

  it('accepts interactive elements without data-testid', () => {
    const event: EventInput = {
      type: 'dead_click',
      element: 'button.submit',
      page: '/form',
    };

    expect(buildIssue(event)).not.toBeNull();
    expect(buildIssue(event)!.summary).toBe('Interactive element not responding');
  });
});
