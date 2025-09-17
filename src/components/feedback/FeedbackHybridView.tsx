import React from 'react';
import { FeedbackCanvas } from './FeedbackCanvas';
import { FeedbackList } from './FeedbackList';
import { CommentThread } from './CommentThread';
import { useFeedbackStore, Pin } from './store';

interface FeedbackHybridViewProps {
  className?: string;
}

export const FeedbackHybridView = ({ className }: FeedbackHybridViewProps) => {
  const { pins, selectedPinId, setSelectedPin, updatePinStatus } = useFeedbackStore();

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin.id);
    // Add any additional logic for opening comment thread
  };

  return (
    <div className={`grid grid-cols-3 gap-4 h-full ${className}`}>
      <div className="col-span-2 flex flex-col">
        <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
          <FeedbackCanvas
            pins={pins}
            onPinClick={handlePinClick}
            selectedPinId={selectedPinId}
            className="w-full h-full"
          />
        </div>
        {selectedPinId && (
          <div className="h-1/3 mt-4 bg-white rounded-lg shadow overflow-hidden">
            <CommentThread pinId={selectedPinId} />
          </div>
        )}
      </div>
      <div className="overflow-auto">
        <FeedbackList
          pins={pins}
          onPinSelect={handlePinClick}
          onStatusChange={updatePinStatus}
          selectedPinId={selectedPinId}
          className="bg-white rounded-lg shadow"
        />
      </div>
    </div>
  );
};
