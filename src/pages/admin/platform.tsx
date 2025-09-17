import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PlatformAnalytics from '@/components/admin/PlatformAnalytics';
import ModeratorManagement from '@/components/admin/ModeratorManagement';
import TestGroupOverview from '@/components/admin/TestGroupOverview';
import SystemHealth from '@/components/admin/SystemHealth';

type TabType = 'analytics' | 'moderators' | 'test-groups' | 'system-health';

export default function AdminPlatform() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <PlatformAnalytics />;
      case 'moderators':
        return <ModeratorManagement />;
      case 'test-groups':
        return <TestGroupOverview />;
      case 'system-health':
        return <SystemHealth />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Platform Administration</h1>

        {/* Tabs */}
        <div className="mt-4 sm:mt-6">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
            >
              <option value="analytics">Analytics</option>
              <option value="moderators">Moderator Management</option>
              <option value="test-groups">Test Groups</option>
              <option value="system-health">System Health</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === 'analytics'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('moderators')}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === 'moderators'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Moderator Management
              </button>
              <button
                onClick={() => setActiveTab('test-groups')}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === 'test-groups'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Test Groups
              </button>
              <button
                onClick={() => setActiveTab('system-health')}
                className={`px-3 py-2 font-medium text-sm rounded-md ${
                  activeTab === 'system-health'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                System Health
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">{renderTabContent()}</div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/platform',
        permanent: false,
      },
    };
  }

  // Check if user is an admin
  if (session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/test-groups/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};