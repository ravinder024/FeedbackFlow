import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { DataTable } from '@/components/activity/data-table';
import { columns } from '@/components/activity/columns';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface ActivityPageProps {
  data: any[];
}

async function getEventLogs() {
  try {
    const events = await prisma.eventLog.findMany({
      take: 100,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        eventType: true,
        pinId: true,
        pageUrl: true,
        userId: true,
        testGroupId: true,
        timestamp: true,
        data: true,
      }
    });

    // Fetch user names for the events
    const userIds = Array.from(new Set(events.map(e => e.userId).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Combine events with user data
    const eventsWithUsers = events.map(event => ({
      ...event,
      user: event.userId ? userMap.get(event.userId) : null
    }));

    return eventsWithUsers;
  } catch (error) {
    console.error('Failed to fetch event logs:', error);
    return [];
  }
}

async function getUserActivity() {
  try {
    const activities = await prisma.userActivity.findMany({
      take: 50, // Mix in some user activities
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        userId: true,
        sessionId: true,
        action: true,
        metadata: true,
        timestamp: true,
        ipAddress: true,
        userAgent: true,
      }
    });

    // Fetch user names for activities
    const userIds = Array.from(new Set(activities.map(a => a.userId).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Transform activities to match event log format
    const activitiesAsEvents = activities.map(activity => ({
      id: activity.id,
      eventType: activity.action,
      pinId: null,
      pageUrl: (activity.metadata as any)?.path || null,
      userId: activity.userId,
      testGroupId: null,
      timestamp: activity.timestamp,
      data: {
        ...(activity.metadata as Record<string, any> || {}),
        sessionId: activity.sessionId,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent,
        isUserActivity: true
      },
      user: activity.userId ? userMap.get(activity.userId) : null
    }));

    return activitiesAsEvents;
  } catch (error) {
    console.error('Failed to fetch user activities:', error);
    return [];
  }
}

export default function ActivityPage({ data }: ActivityPageProps) {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Activity Dashboard</h1>
          <p className="text-gray-600 mt-2">
            View and analyze system events and user activities
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable data={data} columns={columns} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  // Check if user is logged in
  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // For now, allow any authenticated user - you can add role checks here
  // if (!session.user.role || session.user.role !== 'admin') {
  //   return {
  //     redirect: {
  //       destination: '/dashboard',
  //       permanent: false,
  //     },
  //   };
  // }

  try {
    // Fetch both event logs and user activities
    const [eventLogs, userActivities] = await Promise.all([
      getEventLogs(),
      getUserActivity()
    ]);

    // Combine and sort by timestamp
    const allData = [...eventLogs, ...userActivities].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Serialize dates for Next.js
    const serializedData = allData.map(item => ({
      ...item,
      timestamp: item.timestamp.toISOString(),
    }));

    return {
      props: {
        data: serializedData,
      },
    };
  } catch (error) {
    console.error('Error fetching activity data:', error);
    return {
      props: {
        data: [],
      },
    };
  }
};
