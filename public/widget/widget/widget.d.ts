export interface WidgetConfig {
    testGroupId: string;
    memberToken: string;
    apiUrl: string;
}
export declare function Widget({ config }: {
    config: WidgetConfig;
}): import("react/jsx-runtime").JSX.Element;
export declare function initializeFeedbackWidget(config: WidgetConfig): void;
export declare function destroyWidget(): void;
