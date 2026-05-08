import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBehaviorTracker, BehaviorTracker } from './tracking/tracker';

// Widget configuration type
export interface WidgetConfig {
  testGroupId: string;
  memberToken: string;
  apiUrl: string;
}

// Widget component
export function Widget({ config }: { config: WidgetConfig }) {
  const openFeedback = () => {
    // Create feedback URL
    const url = new URL(`${config.apiUrl}/feedback`);
    url.searchParams.set('testGroupId', config.testGroupId);
    url.searchParams.set('memberToken', config.memberToken);
    url.searchParams.set('url', window.location.href);

    // Open feedback form in new window/tab
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={openFeedback}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Give Feedback
    </button>
  );
}

// Widget instance tracking
let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;
let tracker: BehaviorTracker | null = null;

function createSessionId(): string {
  return `ff_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Widget API
export function initializeFeedbackWidget(config: WidgetConfig): void {
  if (!config.testGroupId || !config.memberToken || !config.apiUrl) {
    console.error('FeedbackFlow Widget: Missing required configuration');
    return;
  }

  // Clean up any existing widget
  destroyWidget();

  // Create widget container
  container = document.createElement('div');
  container.id = 'feedback-flow-widget';
  document.body.appendChild(container);

  // Start behavior tracking in parallel with widget UI.
  const eventsEndpoint = new URL('/api/events', config.apiUrl).toString();
  tracker = createBehaviorTracker({
    endpoint: eventsEndpoint,
    testGroupId: config.testGroupId,
    sessionId: createSessionId(),
  });
  tracker.start();

  // Mount React component
  root = createRoot(container);
  root.render(<Widget config={config} />);
}

export function destroyWidget(): void {
  tracker?.stop();
  tracker = null;

  if (root) {
    root.unmount();
    container?.remove();
  }
  root = null;
  container = null;
}
