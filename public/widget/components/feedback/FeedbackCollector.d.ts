import React from 'react';
import { Coordinates } from './types';
interface FeedbackCollectorProps {
    onFeedbackCapture: (feedback: {
        coordinates: Coordinates;
        pageUrl: string;
    }) => void;
}
export declare const FeedbackCollector: React.FC<FeedbackCollectorProps>;
export {};
