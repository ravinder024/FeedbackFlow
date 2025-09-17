import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

export default function CollectFeedback() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get the target URL from the query parameters
    const { url } = router.query;
    if (!url) {
      setError('No target URL provided');
      setLoading(false);
      return;
    }

    if (typeof url !== 'string') {
      setError('Invalid URL format');
      setLoading(false);
      return;
    }

    setTargetUrl(url);
    setLoading(false);
  }, [router.query]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (error || !targetUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 mb-4">{error || 'An error occurred'}</div>
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Provide Feedback - FeedbackFlow</title>
      </Head>

      <div className="h-screen flex flex-col">
        <div className="bg-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-white hover:text-indigo-200"
            >
              ← Back
            </button>
            <h1 className="text-lg font-medium">Collecting Feedback</h1>
          </div>
          {session?.user && (
            <div className="text-sm">
              {session.user.name || session.user.email}
            </div>
          )}
        </div>

        <div className="flex-1">
          <FeedbackWidget
            targetUrl={targetUrl}
            mode="collect"
            onClose={() => router.back()}
          />
        </div>
      </div>
    </>
  );
}
