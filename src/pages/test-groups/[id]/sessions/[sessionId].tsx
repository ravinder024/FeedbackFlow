import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { GetServerSideProps } from 'next';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';
import FeedbackHistory from '@/components/feedback/FeedbackHistory';

interface TestSessionPageProps {
  initialSession: any;
  testGroup: any;
  error?: string;
}

export default function TestSessionPage({ initialSession, testGroup, error: initialError }: TestSessionPageProps) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [error, setError] = useState(initialError || '');

  if (authStatus === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (testGroup.status === 'STOPPED') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Session Paused</h1>
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800">
                  This test group is currently stopped by the moderator. You cannot submit feedback at this time.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (testGroup.status === 'DELETED') {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Group Deleted</h1>
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">
                  This test group has been deleted. You no longer have access to this session.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Test Session</h1>
            <p className="text-gray-600 mt-2">
              {testGroup.name} - Session #{initialSession.id}
            </p>
          </div>

          {/* Add your test session content here */}
          <div className="text-center p-8">
            <p className="text-gray-500">Test session functionality coming soon...</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = async (context: any) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  const { id, sessionId } = context.params;

  try {
    const testGroup = await prisma.testGroup.findFirst({
      where: {
        id,
        OR: [
          { moderatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    });

    if (!testGroup) {
      return {
        notFound: true,
      };
    }

    const testSession = await prisma.testSession.findFirst({
      where: {
        id: sessionId,
        testGroupId: id,
      },
    });

    if (!testSession) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        initialSession: JSON.parse(JSON.stringify(testSession)),
        testGroup: JSON.parse(JSON.stringify(testGroup)),
      },
    };
  } catch (error) {
    console.error('Error fetching test session:', error);
    return {
      props: {
        error: 'Failed to load test session',
      },
    };
  }
}; 