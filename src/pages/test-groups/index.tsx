import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import TestGroupList from '@/components/test-groups/TestGroupList';
import { useSession } from 'next-auth/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { UserRole } from '@/types/roles';

interface TestGroupsPageProps {
  testGroups: Prisma.TestGroupGetPayload<{
    include: {
      moderator: {
        select: {
          name: true;
          email: true;
          image: true;
        };
      };
      members: true;
      _count: {
        select: {
          members: true;
          testSessions: true;
        };
      };
    };
  }>[];
}

export default function TestGroups({ testGroups }: TestGroupsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Groups</h1>
          <div className="space-x-4">
            <Link
              href="/test-groups/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create New Group
            </Link>
            <Link
              href="/test-groups/join"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Join Group
            </Link>
          </div>
        </div>

        {/* Test Groups List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {testGroups.length > 0 ? (
              <TestGroupList testGroups={testGroups} />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No test groups yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating a new test group or joining an existing one.</p>
                <div className="space-x-4">
                  <Link
                    href="/test-groups/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create New Group
                  </Link>
                  <Link
                    href="/test-groups/join"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Join Group
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Fetch test groups where the user is a member or moderator
  const testGroups = await prisma.testGroup.findMany({
    where: {
      OR: [
        {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
        {
          moderatorId: session.user.id,
        },
      ],
    },
    include: {
      moderator: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      members: true,
      _count: {
        select: {
          members: true,
          testSessions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return {
    props: {
      testGroups: JSON.parse(JSON.stringify(testGroups)),
    },
  };
}; 