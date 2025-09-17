import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Severity } from './types';

interface FeedbackSystemProps {
  onSubmit?: (feedback: {
    comment: string;
    severity: Severity;
    emotion: string;
  }) => void;
  initialFeedback?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      name: string;
    };
  }>;
}

export function FeedbackSystem({ onSubmit, initialFeedback = [] }: FeedbackSystemProps) {
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState(initialFeedback);

  const handleSubmit = async (comment: string, severity: Severity, emotion: string) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ comment, severity, emotion });
      setShowForm(false);
      setFeedback([
        {
          id: Date.now().toString(),
          content: comment,
          createdAt: new Date().toISOString(),
          user: {
            name: session?.user?.name || 'Anonymous',
          },
        },
        ...feedback,
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        disabled={isSubmitting}
        className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
          isSubmitting ? 'opacity-60' : ''
        }`}
        aria-label="feedback"
      >
        Add Feedback
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">How do you feel about this?</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSubmit(
                  formData.get('comment') as string,
                  formData.get('severity') as Severity,
                  formData.get('emotion') as string
                );
              }}
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                    Comment
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label htmlFor="severity" className="block text-sm font-medium text-gray-700">
                    Severity
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="emotion" className="block text-sm font-medium text-gray-700">
                    Emotion
                  </label>
                  <select
                    id="emotion"
                    name="emotion"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="neutral">😐 Neutral</option>
                    <option value="happy">😊 Happy</option>
                    <option value="sad">😢 Sad</option>
                    <option value="angry">😠 Angry</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div role="status">
        {feedback.length > 0 ? (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="border rounded p-4">
                <p className="text-gray-700">{item.content}</p>
                <div className="mt-2 text-sm text-gray-500">
                  <span>{item.user.name}</span>
                  <span className="mx-2">•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No feedback has been submitted yet.
          </p>
        )}
      </div>
    </div>
  );
} 