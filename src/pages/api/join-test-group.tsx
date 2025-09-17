import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function JoinTestGroup() {
  const router = useRouter();
  const { token } = router.query;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);

  useEffect(() => {
    if (!token || status === 'loading') return;

    const verifyToken = async () => {
      try {
        // Just verify the token without accepting it yet
        const response = await fetch('/api/invitations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to verify invitation');
        }

        const invitationInfo = await response.json();
        setInvitationData(invitationInfo);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token, status]);

  const handleAcceptInvitation = async () => {
    if (!session) {
      // Store the token in localStorage before redirecting to sign in
      if (typeof window !== 'undefined' && token) {
        localStorage.setItem('pendingInvitationToken', token as string);
      }
      signIn();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept invitation');
      }

      const data = await response.json();
      // Redirect to the test group dashboard
      router.push(`/test-groups/${data.testGroupId}/dashboard`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle loading state
  if (status === 'loading' || (loading && !error)) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Loading invitation...</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4">Invitation Error</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <Link
              href="/"
              className="w-full inline-block text-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Return Home
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-indigo-500 text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold mb-2">You've Been Invited!</h2>
          <p className="mb-6 text-gray-600">
            You've been invited to join{' '}
            <span className="font-semibold">
              {invitationData?.testGroup?.name || 'a test group'}
            </span>{' '}
            as a {invitationData?.role?.toLowerCase() || 'member'}.
          </p>

          <button
            onClick={handleAcceptInvitation}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mb-4"
          >
            {session ? 'Accept Invitation' : 'Sign in to Accept'}
          </button>

          <div className="text-sm text-gray-500 text-center">
            By accepting this invitation, you agree to participate in the testing process and
            provide feedback.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 