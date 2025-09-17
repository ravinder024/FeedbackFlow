import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { withAnyRole } from '@/middleware/rbac';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get the time threshold for active sessions (last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // For test members, only return groups they are members of
    const testGroups = await prisma.testGroup.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        moderator: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          select: {
            id: true,
            userId: true,
            role: true,
            joinedAt: true,
          },
        },
        testSessions: {
          where: {
            startedAt: {
              gte: lastWeek,
            },
          },
          select: {
            id: true,
            startedAt: true,
            status: true,
          },
        },
        feedback: {
          where: {
            memberId: session.user.id,
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            members: true,
            testSessions: true,
            feedback: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response to include active sessions and feedback stats
    const formattedGroups = testGroups.map(group => {
      // Get active sessions
      const activeSessions = group.testSessions.filter(
        session => session.status === 'ACTIVE'
      ).length;
      
      // Count user's feedback for this group
      const userFeedbackCount = group.feedback.length;
      
      // Count pending feedback
      const pendingFeedback = group.feedback.filter(
        f => f.status === 'TODO' || f.status === 'IN_PROGRESS'
      ).length;
      
      return {
        id: group.id,
        name: group.name,
        description: group.description || '',
        memberCount: group._count.members,
        activeSessions,
        domain: group.domain,
        moderator: group.moderator,
        createdAt: group.createdAt,
        userFeedbackCount,
        pendingFeedback,
        hasActiveSessions: activeSessions > 0,
      };
    });

    return res.status(200).json(formattedGroups);
  } catch (error) {
    console.error('Error fetching test groups for member:', error);
    return res.status(500).json({ error: 'Failed to fetch test groups' });
  }
}

export default withAnyRole(handler); 