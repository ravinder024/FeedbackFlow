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
declare const widgetAPI: {
    init(config: WidgetConfig): void;
    destroy(): void;
};
export default widgetAPI;
