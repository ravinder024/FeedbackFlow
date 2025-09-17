import React from 'react';
import { createPortal } from 'react-dom';
import { PortalContainer } from './PortalContainer';

interface WidgetConfig {
  testGroupId: string;
  memberToken: string;
  apiUrl: string;
}

interface FeedbackFlowWidget {
  init: (config: WidgetConfig) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    FeedbackFlowWidget: FeedbackFlowWidget;
  }
}

// Widget component
const Widget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [isFeedbackMode, setIsFeedbackMode] = React.useState(false);

  const handleClick = React.useCallback((e: MouseEvent) => {
    if (!isFeedbackMode) return;
    
    e.preventDefault();
    e.stopPropagation();

    const xPercent = (e.clientX / window.innerWidth) * 100;
    const yPercent = (e.clientY / window.innerHeight) * 100;

    // Create feedback URL
    const url = new URL(`${config.apiUrl}/feedback`);
    url.searchParams.set('testGroupId', config.testGroupId);
    url.searchParams.set('memberToken', config.memberToken);
    url.searchParams.set('url', window.location.href);
    url.searchParams.set('xPercent', xPercent.toString());
    url.searchParams.set('yPercent', yPercent.toString());

    window.open(url.toString(), '_blank', 'noopener,noreferrer');
    setIsFeedbackMode(false);
  }, [isFeedbackMode, config]);

  React.useEffect(() => {
    if (isFeedbackMode) {
      document.body.style.cursor = 'crosshair';
      document.addEventListener('click', handleClick);
    } else {
      document.body.style.cursor = '';
      document.removeEventListener('click', handleClick);
    }
    return () => {
      document.body.style.cursor = '';
      document.removeEventListener('click', handleClick);
    };
  }, [isFeedbackMode, handleClick]);

  return (
    <button
      onClick={() => setIsFeedbackMode(!isFeedbackMode)}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {isFeedbackMode ? 'Cancel Feedback' : 'Give Feedback'}
    </button>
  );
};

let container: HTMLElement | null = null;
// Initialization code
const FeedbackFlowWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  return (
    <PortalContainer>
      <Widget config={config} />
    </PortalContainer>
  );
};

export { FeedbackFlowWidget };

// Export the widget API
export default widgetAPI;