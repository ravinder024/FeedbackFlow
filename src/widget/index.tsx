import { destroyWidget, initializeFeedbackWidget } from './widget';
import type { FeedbackFlowWidgetAPI } from './types';

const widgetAPI: FeedbackFlowWidgetAPI = {
  init: initializeFeedbackWidget,
  destroy: destroyWidget,
};

if (typeof window !== 'undefined') {
  window.FeedbackFlowWidget = widgetAPI;
}

export default widgetAPI;
