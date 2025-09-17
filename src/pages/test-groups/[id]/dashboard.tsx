import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { UserRole, TestGroupRole } from '@/types/roles';

interface TestGroup {
  id: string;
  name: string;
  description: string;
  domain: string;
  memberCount: number;
  activeMembers: number;
  totalFeedback: number;
  resolvedPins: number;
  createdAt: string;
  userRole?: TestGroupRole;
}

export default function TestGroupDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [testGroup, setTestGroup] = useState<TestGroup | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchTestGroup = async () => {
      try {
        const response = await fetch(`/api/test-groups/${id}`);

        if (!response.ok) {
          // If the server returned 5xx, try the mock endpoint for local/dev convenience
          if (response.status >= 500) {
            console.warn(`Primary API returned ${response.status}, falling back to mock endpoint`);
            const mockResp = await fetch(`/api/test-groups/mock-${id}`);
            if (mockResp.ok) {
              const mockData = await mockResp.json();
              setTestGroup(mockData);
            } else {
              throw new Error(`Both primary and mock API failed: ${response.status}`);
            }
          } else {
            throw new Error(`Error fetching test group: ${response.status}`);
          }
        } else {
          const data = await response.json();
          setTestGroup(data);

          // Check for active session
          const sessionResponse = await fetch(`/api/test-groups/${id}/sessions/active`);
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData) {
              setActiveSession(sessionData);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch test group (primary + fallback):', error);
        setError('Failed to load test group data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTestGroup();
  }, [id]);

  const handleStartTesting = async () => {
    if (!testGroup) return;
    
    setStartingSession(true);
    try {
      // Start or get session
      const response = await fetch(`/api/test-groups/${id}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: testGroup.domain }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start testing session');
      }
      
      const session = await response.json();
      setActiveSession(session);
      
      // Get widget token
      const tokenResponse = await fetch(`/api/test-groups/${id}/widget-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to generate widget token');
      }
      
      const { token } = await tokenResponse.json();
      
      // Get the current origin for the API URL
      const apiUrl = window.location.origin;
      
      // Option 1: Open in new tab with embedded widget
      // Create a unique window name to avoid reusing the same tab
      const windowName = `test_session_${Date.now()}`;
      
      // Modified approach: Use an iframe wrapper instead of opening in a separate tab
      // This keeps the domain within the context of FeedbackFlow
      
      // Create the URL for the feedback iframe page
      const feedbackWidgetUrl = `${apiUrl}/widget/feedback?testGroupId=${id}&memberToken=${token}`;
      
      // Create the target domain URL
      const testUrl = `https://${testGroup.domain}`;
      
      // Store the current session and URL in localStorage for persistence
      localStorage.setItem('feedbackflow_active_session', JSON.stringify({
        sessionId: session.id,
        testGroupId: id,
        token: token,
        domain: testGroup.domain
      }));
      
      // Option 2: Navigate to the in-app feedback widget page (iframe wrapper)
      router.push(`/widget/feedback?testGroupId=${id}&memberToken=${token}`);
    } catch (error) {
      console.error('Error starting test session:', error);
      setError('Failed to start testing session. Please try again.');
    } finally {
      setStartingSession(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !testGroup) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-500">{error || "Test group not found"}</p>
          <Link href="/test-groups/dashboard" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Back to Test Groups
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isModerator = session?.user?.role === UserRole.MODERATOR || isAdmin;
  const isTestMember = session?.user?.role === UserRole.TEST_MEMBER || isModerator;

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">{testGroup.name}</h1>
            
            {isModerator && (
              <div className="flex space-x-3">
                <Link
                  href={`/test-groups/${id}/members/invite`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Invite Members
                </Link>
              </div>
            )}
          </div>
          <p className="mt-2 text-gray-600">{testGroup.description}</p>
          <p className="mt-1 text-sm text-gray-500">Domain: {testGroup.domain}</p>
        </div>

        {isTestMember && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Domain</h2>
            <p className="mb-4 text-gray-600">
              Start a testing session to provide feedback on {testGroup.domain}. You'll be able to leave comments, suggest improvements, and rate your experience.
            </p>
            
            {activeSession ? (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="mb-3 sm:mb-0 sm:mr-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <span className="mr-1.5 h-2.5 w-2.5 rounded-full bg-green-500"></span>
                    Active Session
                  </span>
                </div>
                <a
                  href={`https://${testGroup.domain}?session=${activeSession.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue Testing
                </a>
              </div>
            ) : (
              <button
                onClick={handleStartTesting}
                disabled={startingSession}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startingSession ? 'Starting...' : 'Start Testing'}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Stats</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Members</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{testGroup.memberCount}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {testGroup.activeMembers} active
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Active Feedback Pins</h3>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{testGroup.feedback || testGroup.totalFeedback || 0}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Resolved Pins</h3>
                <p className="mt-1 text-2xl font-semibold text-green-600">{testGroup.resolvedPins || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-3">
              <Link
                href={`/test-groups/${id}/members/manage`}
                className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">👥</span>
                  <div>
                    <h3 className="font-medium">Manage Members</h3>
                    <p className="text-sm text-gray-500">View and manage team members</p>
                  </div>
                </div>
              </Link>
              
              <Link
                href={`/feedback/history?groupId=${id}`}
                className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <span className="text-lg mr-3">📝</span>
                  <div>
                    <h3 className="font-medium">Feedback History</h3>
                    <p className="text-sm text-gray-500">View all feedback for this group</p>
                  </div>
                </div>
              </Link>
              
              {isModerator && (
                <Link
                  href={`/test-groups/${id}/analytics`}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">📊</span>
                    <div>
                      <h3 className="font-medium">Analytics</h3>
                      <p className="text-sm text-gray-500">View feedback analytics and trends</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}