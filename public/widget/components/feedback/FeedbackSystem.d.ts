import { Severity } from './types';
interface FeedbackSystemProps {
    onSubmit?: (feedback: {
        comment: string;
        severity: Severity;
        emotion: string;
    }) => void;
    initialFeedback?: Array<{
        id: string;
        content: string;
        createdAt: string;
        user: {
            name: string;
        };
    }>;
}
export declare function FeedbackSystem({ onSubmit, initialFeedback }: FeedbackSystemProps): import("react/jsx-runtime").JSX.Element;
export {};
