import React, { useState, useEffect } from 'react';
import { SessionStatus } from '@prisma/client';
import FeedbackCard from './FeedbackCard';

interface FeedbackItem {
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
}

interface FeedbackTableProps {
  testGroupId: string;
  onStatusChange: (sessionId: string, newStatus: SessionStatus) => void;
}

export default function FeedbackTable({ testGroupId, onStatusChange }: FeedbackTableProps) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SessionStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/moderator/feedback/${testGroupId}`);
        if (!response.ok) throw new Error('Failed to fetch feedback');
        const data = await response.json();
        setFeedback(data.feedback);
      } catch (error) {
        console.error('Error fetching feedback:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [testGroupId]);

  const filteredFeedback = React.useMemo(() => {
    let result = [...feedback];
    
    // Apply filter
    if (filter !== 'ALL') {
      result = result.filter(item => item.session.status === filter);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return a.session.status.localeCompare(b.session.status);
      }
    });

    return result;
  }, [feedback, filter, sortBy]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as SessionStatus | 'ALL')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredFeedback.length} of {feedback.length} items
        </div>
      </div>

      <div className="space-y-4">
        {filteredFeedback.map((item) => (
          <FeedbackCard
            key={item.id}
            feedback={item}
            onStatusChange={onStatusChange}
          />
        ))}

        {filteredFeedback.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No feedback found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
} 