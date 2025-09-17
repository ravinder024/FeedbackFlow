import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TestGroupRole, UserRole } from '@/types/roles';
import Link from 'next/link';

interface TestGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  activeMembers: number;
  pendingFeedback: number;
  totalFeedback: number;
}

export default function ModeratorDashboard() {
  const { data: session } = useSession();
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestGroups = async () => {
      try {
        console.log('Fetching test groups...');
        const response = await fetch('/api/test-groups/list');
        
        if (!response.ok) {
          console.error('Error response:', response.status, response.statusText);
          const errorData = await response.text();
          console.error('Error details:', errorData);
          throw new Error(`Error fetching test groups: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received test groups:', data);
        
        // Ensure data is an array
        if (Array.isArray(data)) {
          setTestGroups(data);
        } else {
          console.error('API returned non-array data:', data);
          setTestGroups([]);
          setError('Invalid data format received from server');
        }
      } catch (error) {
        console.error('Failed to fetch test groups:', error);
        setTestGroups([]);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTestGroups();
  }, []);

  if (session?.user?.role !== UserRole.MODERATOR && session?.user?.role !== UserRole.ADMIN) {
    return (
        <DashboardLayout>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
            <p className="mt-2 text-gray-600">You need moderator privileges to view this page.</p>
          </div>
        </DashboardLayout>
      );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Test Groups</h1>
          <Link
            href="/test-groups/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Create New Test Group
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow mb-4 p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : testGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {testGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{group.name}</h2>
                      <p className="mt-1 text-sm text-gray-500">{group.description}</p>
                    </div>
                    <Link
                      href={`/test-groups/${group.id}/dashboard`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      Manage
                    </Link>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500">Members</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{group.memberCount}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {group.activeMembers} active now
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500">Pending Feedback</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {group.pendingFeedback}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {group.totalFeedback > 0 
                          ? ((group.pendingFeedback / group.totalFeedback) * 100).toFixed(1) 
                          : '0'}% of total
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-500">Total Feedback</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">
                        {group.totalFeedback}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Link
                        href={`/test-groups/${group.id}/members/invite`}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full justify-center"
                      >
                        Invite Members
                      </Link>
                      <Link
                        href={`/test-groups/${group.id}/settings`}
                        className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 w-full justify-center"
                      >
                        Settings
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No test groups found. Create your first test group to get started.</p>
            <Link
              href="/test-groups/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Create Test Group
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 