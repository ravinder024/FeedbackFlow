import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { UserRole } from '@/types/roles';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (session.user.role !== UserRole.TEST_MEMBER) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get test groups the user is a member of
    const testGroups = await prisma.testGroup.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        domain: true,
        status: true
      }
    });

    // Get active testing sessions for the user
    const activeSessions = await prisma.testingSession.findMany({
      where: {
        userId: session.user.id,
        endTime: null // Only get active sessions (no end time)
      },
      include: {
        testGroup: {
          select: {
            name: true
          }
        }
      }
    });

    // Transform the sessions data to include test group name
    const formattedSessions = activeSessions.map(session => ({
      ...session,
      testGroupName: session.testGroup.name
    }));

    return res.status(200).json({
      testGroups,
      activeSessions: formattedSessions
    });
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 