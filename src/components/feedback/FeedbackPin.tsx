import React from 'react';

interface FeedbackPinProps {
  id: string;
  x: number;
  y: number;
  domPath: string;
  onClick?: () => void;
  isHighlighted?: boolean;
}

export const FeedbackPin: React.FC<FeedbackPinProps> = ({
  id,
  x,
  y,
  domPath,
  onClick,
  isHighlighted = false,
}) => {
  return (
    <div
      className={`absolute w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
        isHighlighted ? 'z-50 scale-125' : 'z-40'
      }`}
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={onClick}
      title={domPath}
    >
      <div
        className={`w-full h-full rounded-full border-2 ${
          isHighlighted
            ? 'bg-indigo-500 border-indigo-600'
            : 'bg-red-500 border-red-600'
        }`}
      />
      <div
        className={`absolute inset-0 animate-ping rounded-full ${
          isHighlighted ? 'bg-indigo-400' : 'bg-red-400'
        } opacity-75`}
      />
    </div>
  );
};
