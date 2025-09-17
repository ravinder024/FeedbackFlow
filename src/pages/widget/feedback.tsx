import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
import Head from 'next/head';

export default function FeedbackWidgetPage() {
  const router = useRouter();
  const { testGroupId, memberToken } = router.query;
  const [testSession, setTestSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(true);

  useEffect(() => {
    // Validate query parameters
    if (!testGroupId || !memberToken) {
      setError('Missing required parameters. Please ensure you have the correct link.');
      return;
    }

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/test-groups/${testGroupId}/sessions/active`, {
          headers: {
            'Authorization': `Bearer ${memberToken}`
          }
        });
        if (!response.ok) throw new Error('Invalid session or token');
        const session = await response.json();
        setTestSession(session);
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'WIDGET_READY' }, '*');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to initialize feedback widget. Please try again later.');
      }
    };

    fetchSession();
  }, [testGroupId, memberToken]);

  // Update handleFeedbackSubmit to return void
  const handleFeedbackSubmit = async (feedback: any): Promise<void> => {
    try {
      const response = await fetch(`/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${memberToken}`
        },
        body: JSON.stringify({
          ...feedback,
          testGroupId,
          url: document.referrer || window.location.href
        })
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'FEEDBACK_SUBMITTED', payload: { success: true } }, '*');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  // Add fallback for missing testSession
  if (!testSession) {
    return (
      <div className="p-4 flex justify-center items-center h-full">
        <p className="text-red-600">Error: Test session not found. Please try again later.</p>
      </div>
    );
  }

  // Validate groupUrl
  const groupUrl = testSession?.domainUrl || testSession?.targetUrl || window.location.origin;

  if (!testing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-white">
        <h2 className="text-2xl font-bold mb-4">Testing Ended</h2>
        <button className="px-6 py-2 bg-indigo-600 text-white rounded" onClick={() => setTesting(true)}>
          Restart Testing
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <Head>
        <title>FeedbackFlow Widget</title>
        <style>{`
          body { margin: 0; padding: 0; background: transparent; }
        `}</style>
      </Head>
      <FeedbackWidget 
        testSession={testSession} 
        onFeedbackSubmit={handleFeedbackSubmit} 
        url={groupUrl}
      />
      {/* Floating End Testing button */}
      <button
        className="fixed top-6 right-6 px-5 py-2 bg-red-600 text-white rounded-lg shadow-lg z-[1000001] font-bold text-lg"
        onClick={() => setTesting(false)}
      >
        End testing
      </button>
    </div>
  );
}