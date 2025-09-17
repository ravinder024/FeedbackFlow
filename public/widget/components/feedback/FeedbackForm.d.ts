import React from 'react';
import { Severity } from './types';
interface FeedbackFormProps {
    onSubmit: (comment: string, emotion: string, severity: Severity) => void;
    onClose: () => void;
    onDelete: () => void;
    initialComment?: string;
    initialEmotion?: string;
    initialSeverity?: Severity;
}
declare const FeedbackForm: React.FC<FeedbackFormProps>;
export default FeedbackForm;
