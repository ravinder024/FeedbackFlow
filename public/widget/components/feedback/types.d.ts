export type Severity = 'Low' | 'Medium' | 'High';
export interface TestSessionContext {
    id: string;
    testGroupId: string;
    isActive: boolean;
    role?: 'moderator' | 'member';
}
export interface FeedbackWidgetProps {
    testSession?: TestSessionContext | null;
    onFeedbackSubmit?: (feedback: {
        content: string;
        rating: number | null;
        emotion: string;
        metadata: {
            pageUrl: string;
            severity: Severity;
        };
        testSessionId: string;
    }) => Promise<void>;
    url?: string;
    targetUrl?: string;
    mode?: 'session' | 'collect';
    onClose?: () => void;
}
