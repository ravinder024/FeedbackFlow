import React from 'react';
interface FeedbackPinProps {
    id: string;
    x: number;
    y: number;
    domPath: string;
    onClick?: () => void;
    isHighlighted?: boolean;
}
export declare const FeedbackPin: React.FC<FeedbackPinProps>;
export {};
