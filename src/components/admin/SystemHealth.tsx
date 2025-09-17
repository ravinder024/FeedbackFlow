import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface SystemHealthData {
  widget: {
    loadTime: {
      average: number;
      p95: number;
      trend: Array<{
        date: string;
        average: number;
        p95: number;
      }>;
    };
    errors: {
      total: number;
      byType: Array<{
        type: string;
        count: number;
      }>;
      trend: Array<{
        date: string;
        count: number;
      }>;
    };
  };
  api: {
    requests: {
      total: number;
      byEndpoint: Array<{
        endpoint: string;
        count: number;
        avgResponseTime: number;
      }>;
      trend: Array<{
        date: string;
        count: number;
      }>;
    };
    errors: {
      total: number;
      byStatusCode: Array<{
        statusCode: number;
        count: number;
      }>;
    };
  };
}

export default function SystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const response = await fetch(`/api/admin/system-health?timeRange=${timeRange}`);
        if (!response.ok) throw new Error('Failed to fetch system health data');
        const data = await response.json();
        setHealthData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    // Set up polling every 5 minutes
    const interval = setInterval(fetchHealthData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timeRange]);

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

  if (!healthData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md border
              ${timeRange === '24h'
                ? 'bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 text-sm font-medium border-t border-b
              ${timeRange === '7d'
                ? 'bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md border
              ${timeRange === '30d'
                ? 'bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            30d
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Widget Performance</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {healthData.widget.loadTime.average.toFixed(2)}ms
          </p>
          <p className="mt-1 text-sm text-gray-500">Average Load Time</p>
          <p className="mt-2 text-sm text-gray-500">
            P95: {healthData.widget.loadTime.p95.toFixed(2)}ms
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Widget Errors</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {healthData.widget.errors.total}
          </p>
          <p className="mt-1 text-sm text-gray-500">Total Errors</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">API Requests</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {healthData.api.requests.total}
          </p>
          <p className="mt-1 text-sm text-gray-500">Total Requests</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">API Errors</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {healthData.api.errors.total}
          </p>
          <p className="mt-1 text-sm text-gray-500">Total Errors</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget Load Time Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Widget Load Time Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData.widget.loadTime.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="average"
                  name="Average Load Time"
                  stroke="#3B82F6"
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="p95"
                  name="P95 Load Time"
                  stroke="#6B7280"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API Request Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Request Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData.api.requests.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Request Count"
                  stroke="#10B981"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Widget Error Types</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData.widget.errors.byType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Error Count" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* API Response Time by Endpoint */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">API Response Time by Endpoint</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData.api.requests.byEndpoint}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="endpoint" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgResponseTime" name="Avg Response Time (ms)" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* API Status Code Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Error Status Codes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {healthData.api.errors.byStatusCode.map((error) => (
            <div
              key={error.statusCode}
              className="bg-gray-50 rounded-lg p-4 text-center"
            >
              <div className="text-2xl font-bold text-gray-900">{error.statusCode}</div>
              <div className="text-sm text-gray-500">{error.count} errors</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}