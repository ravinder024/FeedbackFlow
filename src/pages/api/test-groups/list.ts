import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get test groups with basic info based on user role
    const testGroups = await prisma.testGroup.findMany({
      where: user.role === UserRole.TEST_MEMBER
        ? { members: { some: { userId: session.user.id } } }
        : user.role === UserRole.ADMIN 
          ? {} // Admin can see all groups
          : { moderatorId: session.user.id }, // Moderators see only their groups
      include: {
        moderator: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get feedback stats by joining through sessions
    const feedbackStats = await prisma.testFeedback.groupBy({
      by: ['sessionId'],
      where: {
        session: {
          testGroupId: { in: testGroups.map(g => g.id) }
        }
      },
      _count: true
    });

    // Get active members (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const activeMembers = await prisma.testGroupMember.groupBy({
      by: ['testGroupId'],
      where: {
        testGroupId: { in: testGroups.map(g => g.id) },
        joinedAt: { gt: lastWeek }
      },
      _count: true
    });

    // Get testGroupIds for each feedback session
    const feedbackSessions = await prisma.testSession.findMany({
      where: {
        id: { in: feedbackStats.map(f => f.sessionId) }
      },
      select: {
        id: true,
        testGroupId: true
      }
    });

    // Format the response
    const formattedGroups = testGroups.map(group => {
      const active = activeMembers.find(m => m.testGroupId === group.id);
      
      // Sum up feedback for all sessions in this group
      const groupFeedbackCount = feedbackStats
        .filter(f => feedbackSessions.find(s => s.id === f.sessionId && s.testGroupId === group.id))
        .reduce((sum, f) => sum + f._count, 0);

      return {
        id: group.id,
        name: group.name,
        description: group.description || '',
        domain: group.domain || '',
        memberCount: group._count.members,
        activeMembers: active?._count || 0,
        totalSessions: group._count.sessions,
        totalFeedback: groupFeedbackCount,
        moderator: {
          name: group.moderator?.name || '',
          email: group.moderator?.email || '',
          image: group.moderator?.image || null,
        },
        createdAt: group.createdAt,
      };
    });

    return res.status(200).json(formattedGroups);
  } catch (error) {
    console.error('Error fetching test groups:', error);
    return res.status(500).json({ error: 'Failed to fetch test groups' });
  }
}
