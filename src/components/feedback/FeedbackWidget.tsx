'use client';

import React, { useState } from 'react';
import { FeedbackWidgetProps, Coordinates, Severity } from './types';
import { FeedbackCollector } from './FeedbackCollector';

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ 
  testSession, 
  onFeedbackSubmit,
  url,
  targetUrl,
  mode = 'session',
  onClose
}) => {
  const [activeFeedback, setActiveFeedback] = useState<{
    coordinates: Coordinates;
    pageUrl: string;
  } | null>(null);
  const [comment, setComment] = useState('');
  const [emotion, setEmotion] = useState<string>('😊');
  const [severity, setSeverity] = useState<Severity>('Low');

  const handleFeedbackCapture = (feedback: {
    coordinates: Coordinates;
    pageUrl: string;
  }) => {
    // In collect mode, we don't need an active test session
    if (mode === 'session' && !testSession?.isActive) return;
    setActiveFeedback(feedback);
  };

  const handleSubmit = async () => {
    if (!activeFeedback) return;

    // In collect mode, we'll save to localStorage
    if (mode === 'collect') {
      const feedback = {
        content: comment,
        emotion,
        severity,
        coordinates: activeFeedback.coordinates,
        pageUrl: targetUrl || url,
        timestamp: new Date().toISOString(),
      };

      // Get existing feedback from localStorage
      const storedFeedback = localStorage.getItem('demo_feedback');
      const feedbackList = storedFeedback ? JSON.parse(storedFeedback) : [];
      
      // Add new feedback
      feedbackList.push(feedback);
      localStorage.setItem('demo_feedback', JSON.stringify(feedbackList));
      
      setActiveFeedback(null);
      setComment('');
      setEmotion('😊');
      setSeverity('Low');

      // Show success message
      alert('Feedback saved successfully!');
      if (onClose) onClose();
      return;
    }

    // In session mode, submit to backend
    if (!testSession || !onFeedbackSubmit) return;

    const feedbackData = {
      content: comment,
      rating: null,
      emotion,
      metadata: {
        xPercent: activeFeedback.coordinates.xPercent,
        yPercent: activeFeedback.coordinates.yPercent,
        pageUrl: activeFeedback.pageUrl,
        severity
      },
      testSessionId: testSession.id
    };

    await onFeedbackSubmit(feedbackData);
    setActiveFeedback(null);
    setComment('');
    setEmotion('😊');
    setSeverity('Low');
  };

  return (
    <div className="min-h-screen">
      <FeedbackCollector onFeedbackCapture={handleFeedbackCapture} />
      
      {/* Feedback Form */}
      {activeFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Provide Feedback</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <p className="text-sm text-gray-500">
                {activeFeedback.coordinates.xPercent.toFixed(1)}% from left,{' '}
                {activeFeedback.coordinates.yPercent.toFixed(1)}% from top
              </p>
            </div>
            <textarea
              className="w-full p-2 border rounded mb-4"
              placeholder="Enter your feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => setActiveFeedback(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;