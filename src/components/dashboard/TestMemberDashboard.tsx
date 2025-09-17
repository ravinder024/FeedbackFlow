import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { TestGroup, TestingSession } from '@prisma/client';
import TestGroupCard from './TestGroupCard';

interface DashboardData {
  testGroups: TestGroup[];
  activeSessions: TestingSession[];
}

export default function TestMemberDashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData>({ testGroups: [], activeSessions: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/testing/dashboard');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-semibold mb-4">My Test Groups</h2>
        {dashboardData.testGroups.length === 0 ? (
          <p className="text-gray-500">You haven't been assigned to any test groups yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.testGroups.map((group) => (
              <TestGroupCard key={group.id} testGroup={group} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Active Testing Sessions</h2>
        {dashboardData.activeSessions.length === 0 ? (
          <p className="text-gray-500">No active testing sessions.</p>
        ) : (
          <div className="space-y-4">
            {dashboardData.activeSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200"
              >
                <p className="font-medium">{session.testGroupName}</p>
                <p className="text-sm text-gray-600">
                  Started: {new Date(session.startTime).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
} 