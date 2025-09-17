import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PlatformStats {
  users: {
    byRole: Array<{ role: string; _count: number }>;
    total: number;
  };
  testGroups: {
    byStatus: Array<{ status: string; _count: number }>;
    total: number;
  };
  feedback: {
    total: number;
    trend: Array<{ date: string; count: number }>;
    averageRating: number;
    averageQualityScore: number;
  };
  sessions: {
    active: number;
    total: number;
    completionRate: number;
  };
  growth: {
    groupCreationTrend: Array<{ date: string; count: number }>;
  };
}

export default function PlatformAnalytics() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/platform-stats');
        if (!response.ok) throw new Error('Failed to fetch platform stats');
        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Error: {error}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.users.total}</p>
          <div className="mt-4">
            {stats.users.byRole.map((role) => (
              <div key={role.role} className="flex justify-between text-sm text-gray-500">
                <span>{role.role}</span>
                <span>{role._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Test Groups</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.testGroups.total}</p>
          <div className="mt-4">
            {stats.testGroups.byStatus.map((status) => (
              <div key={status.status} className="flex justify-between text-sm text-gray-500">
                <span>{status.status}</span>
                <span>{status._count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.sessions.active}</p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Total Sessions</span>
              <span>{stats.sessions.total}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Completion Rate</span>
              <span>{stats.sessions.completionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Feedback</h3>
          <p className="mt-2 text-3xl font-bold text-purple-600">{stats.feedback.total}</p>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Avg Rating</span>
              <span>{stats.feedback.averageRating.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Quality Score</span>
              <span>{(stats.feedback.averageQualityScore * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Feedback Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.feedback.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Feedback Count"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Group Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.growth.groupCreationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="New Groups"
                  stroke="#82ca9d"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
} 