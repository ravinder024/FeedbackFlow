import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface FeedbackItem {
  id: string;
  content: string;
  rating: number | null;
  category: string | null;
  qualityScore: number | null;
  createdAt: string;
  testGroup: {
    name: string;
    domain: string;
  };
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function FeedbackHistory() {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async (page: number = 1) => {
    try {
      const response = await fetch(`/api/testing/my-feedback?page=${page}`);
      const data = await response.json();
      setFeedback(data.feedback);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchFeedback();
    }
  }, [session]);

  const handlePageChange = (newPage: number) => {
    setLoading(true);
    fetchFeedback(newPage);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold mb-4">My Feedback History</h2>
      
      {feedback.length === 0 ? (
        <p className="text-gray-500">You haven't submitted any feedback yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="bg-white p-6 rounded-lg shadow border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{item.testGroup.name}</h3>
                    <a
                      href={item.testGroup.domain}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {new URL(item.testGroup.domain).hostname}
                    </a>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{item.content}</p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {item.rating && (
                    <div>
                      <span className="font-medium">Rating:</span> {item.rating}/5
                    </div>
                  )}
                  {item.category && (
                    <div>
                      <span className="font-medium">Category:</span> {item.category}
                    </div>
                  )}
                  {item.qualityScore && (
                    <div>
                      <span className="font-medium">Quality Score:</span>{' '}
                      {Math.round(item.qualityScore * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  pagination.currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  pagination.currentPage === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 