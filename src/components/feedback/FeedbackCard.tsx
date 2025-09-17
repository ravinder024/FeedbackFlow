import React from 'react';
import { SessionStatus } from '@prisma/client';

interface FeedbackCardProps {
  feedback: {
    id: string;
    content: string;
    category: string | null;
    rating: number | null;
    qualityScore: number | null;
    createdAt: string;
    session: {
      id: string;
      status: SessionStatus;
    };
    user: {
      name: string | null;
      email: string | null;
    };
  };
  onStatusChange: (sessionId: string, newStatus: SessionStatus) => void;
}

export default function FeedbackCard({ feedback, onStatusChange }: FeedbackCardProps) {
  const statusColors = {
    ACTIVE: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[feedback.session.status]}`}>
              {feedback.session.status}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(feedback.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            {feedback.user.name || feedback.user.email || 'Anonymous User'}
          </h3>
        </div>

        <select
          value={feedback.session.status}
          onChange={(e) => onStatusChange(feedback.session.id, e.target.value as SessionStatus)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="text-gray-700">{feedback.content}</div>

      <div className="text-sm text-gray-500 space-y-1">
        {feedback.category && (
          <div>Category: {feedback.category}</div>
        )}
        {feedback.rating !== null && (
          <div>Rating: {feedback.rating}/5</div>
        )}
        {feedback.qualityScore !== null && (
          <div>Quality Score: {Math.round(feedback.qualityScore * 100)}%</div>
        )}
      </div>
    </div>
  );
} 