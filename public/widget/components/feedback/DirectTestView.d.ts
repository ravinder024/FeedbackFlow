import React from 'react';
interface DirectTestViewProps {
    url: string;
    onFeedbackClick: (feedback: {
        coordinates: {
            x: number;
            y: number;
        };
        pageUrl: string;
    }) => void;
}
export declare const DirectTestView: React.FC<DirectTestViewProps>;
export {};
