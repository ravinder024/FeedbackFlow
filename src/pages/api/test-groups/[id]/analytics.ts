import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { Prisma } from '@prisma/client';
import { UserRole } from '@/types/roles';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  try {
    // Check if test group exists and user has access
    const testGroup = await prisma.testGroup.findUnique({
      where: { id: id as string },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!testGroup) {
      return res.status(404).json({ error: 'Test group not found' });
    }

    const isMember = testGroup.members.length > 0;
    const isModerator = testGroup.moderatorId === session.user.id;
    const isAdmin = session.user.role === UserRole.ADMIN;

    if (!isMember && !isModerator && !isAdmin) {
      return res.status(403).json({ error: 'Not a member of this test group' });
    }

    // Get test group analytics
    const [
      memberCount,
      testSessionCount,
      activeSessions,
    ] = await Promise.all([
      prisma.testGroupMember.count({
        where: { testGroupId: testGroup.id },
      }),
      prisma.testSession.count({
        where: { testGroupId: testGroup.id },
      }),
      prisma.testSession.count({
        where: {
          testGroupId: testGroup.id,
          status: 'ACTIVE',
        },
      }),
    ]);

    // Get recent test sessions with feedback stats
    const recentSessions = await prisma.testSession.findMany({
      where: { testGroupId: testGroup.id },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        startedBy: {
          select: {
            name: true,
            email: true,
          },
        },
        feedback: true,
      },
    });

    // Get member activity stats
    const memberStats = await prisma.testGroupMember.findMany({
      where: { testGroupId: testGroup.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            feedback: {
              where: {
                session: {
                  testGroupId: testGroup.id,
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return res.status(200).json({
      overview: {
        memberCount,
        testSessionCount,
        activeSessions,
      },
      recentSessions: recentSessions.map(session => ({
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        status: session.status,
        startedBy: session.startedBy,
        feedbackCount: session.feedback.length,
      })),
      memberStats: memberStats.map(member => ({
        id: member.id,
        name: member.user.name,
        email: member.user.email,
        joinedAt: member.joinedAt,
        feedbackCount: member.user.feedback.length,
      })),
    });
  } catch (error) {
    console.error('Error fetching test group analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
} 