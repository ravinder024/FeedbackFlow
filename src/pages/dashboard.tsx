import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { UserRole } from '@/types/roles';
import { useRouter } from 'next/router';

interface TestGroup {
  id: string;
  name: string;
  description: string;
  domain: string;
  memberCount: number;
  activeSessions: number;
  userFeedbackCount: number;
  pendingFeedback: number;
  hasActiveSessions: boolean;
}

interface FeedbackSummary {
  totalFeedbackCount: number;
  feedbackByEmotion: Record<string, number>;
  feedbackByTestGroup: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  recentFeedback: Array<{
    id: string;
    content: string;
    emotion: string | null;
    testGroupId: string;
    testGroupName: string;
    createdAt: string;
  }>;
}

export default function MemberDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect non-test members
    if (status === 'authenticated' && session.user.role !== UserRole.TEST_MEMBER) {
      router.push('/test-groups/dashboard');
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch test groups the member belongs to
        const groupsResponse = await fetch('/api/test-groups/member');
        if (!groupsResponse.ok) {
          throw new Error(`Error fetching test groups: ${groupsResponse.status}`);
        }
        const groupsData = await groupsResponse.json();
        setTestGroups(Array.isArray(groupsData) ? groupsData : []);

        // Fetch feedback summary
        const summaryResponse = await fetch('/api/feedback/summary');
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setFeedbackSummary(summaryData);
        } else {
          console.error('Error fetching feedback summary:', summaryResponse.status);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, session, router]);

  const handleStartTesting = async (testGroupId: string, domain: string) => {
    try {
      // Check if there's an active session first
      const response = await fetch(`/api/test-groups/${testGroupId}/sessions/active`);
      
      let sessionId;
      
      if (response.ok) {
        // If there's an active session, use it
        const sessionData = await response.json();
        sessionId = sessionData.id;
      } else if (response.status === 404) {
        // No active session, try to start one
        const startResponse = await fetch(`/api/test-groups/${testGroupId}/sessions/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (startResponse.ok) {
          const sessionData = await startResponse.json();
          sessionId = sessionData.id;
        } else {
          alert('Failed to start testing session. Please try again later.');
          return;
        }
      } else {
        alert('Failed to check active sessions. Please try again later.');
        return;
      }
      
      // Get widget token
      const tokenResponse = await fetch(`/api/test-groups/${testGroupId}/widget-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (tokenResponse.ok) {
        const { token } = await tokenResponse.json();
        
        // Get the current origin for the API URL
        const apiUrl = window.location.origin;
        
        // Open the website with the widget script
        const testUrl = `https://${domain}`;
        
        // Create a unique window name to avoid reusing the same tab
        const windowName = `test_session_${Date.now()}`;
        
        // Replace window.open with in-app navigation
        const testWindow = null; // Disable opening a new tab
        router.push(`/widget/feedback?domain=${encodeURIComponent(domain)}`);
        
        // If the window was successfully opened, inject the widget
        if (testWindow) {
          // Wait a moment for the page to load before injecting the script
          setTimeout(() => {
            // Create the widget script
            const widgetScript = `
                (function() {
                  const script = document.createElement('script');
                  script.src = '${apiUrl}/api/widget/feedback-widget.js';
                  script.onload = function() {
                    window.FeedbackFlow.init({
                      testGroupId: '${testGroupId}',
                      memberToken: '${token}',
                      apiUrl: '${apiUrl}'
                    });
                  };
                  document.body.appendChild(script);
                })();
              `;
              
              try {
                // Try to inject the widget script
                testWindow.postMessage({
                  type: 'INJECT_FEEDBACK_WIDGET',
                  testGroupId,
                  token,
                  apiUrl,
                  sessionId
                }, '*');
                
                // As a fallback, also try to open with the script directly if possible
                if (testWindow) {
                  const scriptEl = testWindow.document.createElement('script');
                  scriptEl.type = 'text/javascript';
                  scriptEl.textContent = widgetScript;
                  testWindow.document.head.appendChild(scriptEl);
                } else {
                  console.error('Could not inject widget script.');
                }
            } catch (err) {
              console.error('Could not inject widget script:', err);
              if (testWindow) {
                const scriptEl = testWindow.document.createElement('script');
                scriptEl.type = 'text/javascript';
                scriptEl.textContent = widgetScript;
                testWindow.document.head.appendChild(scriptEl);
              } else {
                alert('Widget injection failed. Please contact support or try again later.');
              }
            }
          }, 1000);
          } else {
            alert('Failed to open the test website. Please check your popup blocker settings or contact support.');
          }
      } else {
        alert('Failed to generate widget token. Please try again later or contact support.');
      }
    } catch (error) {
      console.error('Error starting testing:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    router.push('/');
    return null;
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {session.user.name || session.user.email}!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Test Groups</h2>
            <p className="text-3xl font-bold">{testGroups.length}</p>
            <p className="text-sm text-gray-500 mt-1">Groups you are participating in</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Feedback Given</h2>
            <p className="text-3xl font-bold">{feedbackSummary?.totalFeedbackCount || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total feedback submitted</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-2">Learn</h2>
            <Link href="/guide" className="text-indigo-600 font-medium hover:text-indigo-800 block mt-2">
              Testing Guide
            </Link>
            <Link href="/demo-test" className="text-indigo-600 font-medium hover:text-indigo-800 block mt-1">
              Demo Test Experience
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">My Test Groups</h2>
          </div>

          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : testGroups.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {testGroups.map((group) => (
                <div key={group.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                        {group.hasActiveSessions && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{group.description}</p>
                      <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                        <span>Domain: {group.domain}</span>
                        <span>Feedback: {group.userFeedbackCount || 0}</span>
                        {group.pendingFeedback > 0 && (
                          <span className="text-orange-600">{group.pendingFeedback} pending</span>
                        )}
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Link
                        href={`/feedback/history?groupId=${group.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View Feedback
                      </Link>
                      <button
                        onClick={() => handleStartTesting(group.id, group.domain)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Start Testing
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">You haven't been added to any test groups yet.</p>
              <p className="mt-2 text-sm text-gray-400">
                Contact your test moderator if you believe this is an error.
              </p>
            </div>
          )}
        </div>

        {feedbackSummary?.recentFeedback?.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Recent Feedback</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {feedbackSummary.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="p-6">
                  <div className="flex items-start">
                    <div className="text-2xl mr-4">
                      {feedback.emotion || '😐'}
                    </div>
                    <div>
                      <p className="text-gray-700">{feedback.content}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {feedback.testGroupName} • {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>No feedback available.</div>
        )}
      </div>
    </DashboardLayout>
  );
}