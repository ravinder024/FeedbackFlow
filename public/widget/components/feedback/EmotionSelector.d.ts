import React from 'react';
interface EmotionSelectorProps {
    selectedEmotion: string;
    onSelect: (emotion: string) => void;
}
declare const EmotionSelector: React.FC<EmotionSelectorProps>;
export default EmotionSelector;
