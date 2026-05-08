'use client';

import React, { useState } from 'react';
import { FeedbackWidgetProps, Severity } from './types';

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ 
  testSession, 
  onFeedbackSubmit,
  url,
  targetUrl,
  mode = 'session',
  onClose
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [emotion, setEmotion] = useState<string>('😊');
  const [severity, setSeverity] = useState<Severity>('Low');

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    // In collect mode, we'll save to localStorage
    if (mode === 'collect') {
      const feedback = {
        content: comment,
        emotion,
        severity,
        pageUrl: targetUrl || url,
        timestamp: new Date().toISOString(),
      };

      // Get existing feedback from localStorage
      const storedFeedback = localStorage.getItem('demo_feedback');
      const feedbackList = storedFeedback ? JSON.parse(storedFeedback) : [];
      
      // Add new feedback
      feedbackList.push(feedback);
      localStorage.setItem('demo_feedback', JSON.stringify(feedbackList));
      
      setIsFormOpen(false);
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
        pageUrl: url || window.location.href,
        severity
      },
      testSessionId: testSession.id
    };

    await onFeedbackSubmit(feedbackData);
    setIsFormOpen(false);
    setComment('');
    setEmotion('😊');
    setSeverity('Low');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <button
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        onClick={() => setIsFormOpen(true)}
      >
        Give Feedback
      </button>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Provide Feedback</h3>
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
                onClick={() => setIsFormOpen(false)}
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