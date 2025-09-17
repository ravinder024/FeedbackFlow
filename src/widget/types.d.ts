interface WidgetConfig {
  testGroupId: string;
  memberToken: string;
  apiUrl: string;
}

interface FeedbackFlowWidgetAPI {
  init: (config: WidgetConfig) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    FeedbackFlowWidget: FeedbackFlowWidgetAPI;
  }
}

export { WidgetConfig, FeedbackFlowWidgetAPI };
