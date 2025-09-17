import React from 'react';
import { Pin } from './store';
import { twMerge } from 'tailwind-merge';

interface FeedbackCanvasProps {
  pins: Pin[];
  onPinClick: (pin: Pin) => void;
  selectedPinId?: string;
  className?: string;
}

export const FeedbackCanvas = ({
  pins,
  onPinClick,
  selectedPinId,
  className
}: FeedbackCanvasProps) => {
  return (
    <div className={twMerge('relative w-full h-full overflow-hidden', className)}>
      {pins.map((pin) => (
        <button
          key={pin.id}
          onClick={() => onPinClick(pin)}
          className={twMerge(
            'absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 transition-all duration-200',
            'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
            pin.status === 'new' 
              ? 'bg-blue-500 border-blue-600' 
              : pin.status === 'inProgress' 
              ? 'bg-yellow-500 border-yellow-600'
              : 'bg-green-500 border-green-600',
            selectedPinId === pin.id && 'ring-2 ring-offset-2 scale-110'
          )}
          style={{
            left: `${pin.xPercent}%`,
            top: `${pin.yPercent}%`
          }}
          title={`Pin ${pin.id}`}
        >
          <span className="sr-only">Feedback pin at {pin.xPercent}%, {pin.yPercent}%</span>
        </button>
      ))}
    </div>
  );
};
