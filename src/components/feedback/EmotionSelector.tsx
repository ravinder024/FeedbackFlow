'use client';

import React from 'react';

interface EmotionSelectorProps {
  selectedEmotion: string;
  onSelect: (emotion: string) => void;
}

const emotions = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😕', label: 'Confused' },
  { emoji: '😠', label: 'Angry' },
  { emoji: '🐛', label: 'Bug' },
];

const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onSelect,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '0.5rem',
      }}
    >
      {emotions.map(({ emoji, label }) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          title={label}
          style={{
            padding: '0.5rem',
            fontSize: '1.5rem',
            borderRadius: '0.375rem',
            border: `2px solid ${selectedEmotion === emoji ? 'rgb(79 70 229)' : 'transparent'}`,
            backgroundColor: selectedEmotion === emoji ? 'rgb(238 242 255)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmotionSelector; 