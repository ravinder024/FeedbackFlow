import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// Widget configuration type
export interface WidgetConfig {
  testGroupId: string;
  memberToken: string;
  apiUrl: string;
}

// Widget component
export function Widget({ config }: { config: WidgetConfig }) {
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);

  const handleDocumentClick = useCallback((e: MouseEvent) => {
    if (!isFeedbackMode) return;

    e.preventDefault();
    e.stopPropagation();

    // Calculate percentage coordinates
    const xPercent = (e.clientX / window.innerWidth) * 100;
    const yPercent = (e.clientY / window.innerHeight) * 100;

    // Create feedback URL
    const url = new URL(`${config.apiUrl}/feedback`);
    url.searchParams.set('testGroupId', config.testGroupId);
    url.searchParams.set('memberToken', config.memberToken);
    url.searchParams.set('url', window.location.href);
    url.searchParams.set('xPercent', xPercent.toString());
    url.searchParams.set('yPercent', yPercent.toString());

    // Open feedback form in new window/tab
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
    setIsFeedbackMode(false);
  }, [isFeedbackMode, config]);

  useEffect(() => {
    if (isFeedbackMode) {
      document.body.style.cursor = 'crosshair';
      document.addEventListener('click', handleDocumentClick);
    } else {
      document.body.style.cursor = '';
      document.removeEventListener('click', handleDocumentClick);
    }

    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [isFeedbackMode, handleDocumentClick]);

  return (
    <button
      onClick={() => setIsFeedbackMode(!isFeedbackMode)}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {isFeedbackMode ? 'Cancel Feedback' : 'Give Feedback'}
    </button>
  );
}

// Widget instance tracking
let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

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

  // Mount React component
  root = createRoot(container);
  root.render(<Widget config={config} />);
}

export function destroyWidget(): void {
  if (root) {
    root.unmount();
    container?.remove();
  }
  root = null;
  container = null;
}
