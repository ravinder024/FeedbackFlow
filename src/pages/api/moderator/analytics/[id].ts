import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid test group ID' });
  }

  try {
    // Check if user is moderator of this test group
    const testGroup = await prisma.testGroup.findFirst({
      where: {
        id,
        moderatorId: session.user.id,
      },
    });

    if (!testGroup) {
      return res.status(403).json({ error: 'Not authorized to view this test group' });
    }

    // Get analytics data
    const [memberCount, feedbackCount, activeMembers] = await Promise.all([
      prisma.testGroupMember.count({
        where: { testGroupId: id },
      }),
      prisma.feedback.count({
        where: { testGroupId: id },
      }),
      prisma.testGroupMember.count({
        where: {
          testGroupId: id,
          user: {
            feedback: {
              some: {
                testGroupId: id,
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
          },
        },
      }),
    ]);

    // Get recent feedback
    const recentFeedback = await prisma.feedback.findMany({
      where: { testGroupId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        member: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({
      overview: {
        memberCount,
        feedbackCount,
        activeMembers,
      },
      recentFeedback: recentFeedback.map((f) => ({
        id: f.id,
        comment: f.comment,
        emotion: f.emotion,
        severity: f.severity,
        createdAt: f.createdAt,
        member: f.member,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
} 