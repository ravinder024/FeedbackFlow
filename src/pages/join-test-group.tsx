import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

interface JoinTestGroupProps {
  invitation?: {
    testGroup: {
      name: string;
      domain: string;
    };
    role: string;
  };
  error?: string;
}

export default function JoinTestGroup({ invitation, error: serverError }: JoinTestGroupProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(serverError);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error || 'Invalid or expired invitation link'}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleJoin = async () => {
    setIsJoining(true);
    setProcessing(true);
    setError(undefined);

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: router.query.token,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join test group');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Show success message before redirecting
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Join Test Group</h1>
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">{invitation.testGroup.name}</h2>
            <p className="text-gray-500">{invitation.testGroup.domain}</p>
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700">You have been invited as:</h3>
            <p className="mt-1 text-sm text-gray-900">{invitation.role.replace('_', ' ')}</p>
          </div>
          {error && (
            <div className="mb-4 p-4 rounded-md bg-red-50">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success ? (
            <div className="mb-4 p-4 rounded-md bg-green-50 text-center">
              <p className="text-sm text-green-700 font-medium">Successfully joined test group!</p>
              <p className="text-xs text-green-600 mt-1">Redirecting to your dashboard...</p>
              <div className="mt-2 flex justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700"></div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={isJoining || processing}
              className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isJoining ? 'Joining...' : 'Join Test Group'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { token } = context.query;

  if (!token || typeof token !== 'string') {
    return {
      props: {
        error: 'Invalid invitation link',
      },
    };
  }

  try {
    const invitation = await prisma.testGroupInvitation.findUnique({
      where: { token },
      include: {
        testGroup: {
          select: {
            name: true,
            domain: true,
          },
        },
      },
    });

    if (!invitation) {
      return {
        props: {
          error: 'Invitation not found',
        },
      };
    }

    if (invitation.expiresAt < new Date()) {
      return {
        props: {
          error: 'Invitation has expired',
        },
      };
    }

    if (session?.user?.email && invitation.email !== session.user.email) {
      return {
        props: {
          error: 'This invitation is for a different email address',
        },
      };
    }

    // Check if invitation is already accepted
    if (invitation.acceptedAt) {
      return {
        props: {
          error: 'This invitation has already been used',
        },
      };
    }

    return {
      props: {
        invitation: {
          testGroup: invitation.testGroup,
          role: invitation.role,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return {
      props: {
        error: 'Failed to load invitation',
      },
    };
  }
}; 