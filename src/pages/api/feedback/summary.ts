import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get feedback for this user
    const feedbackItems = await prisma.feedback.findMany({
      where: {
        memberId: session.user.id, // Use memberId instead of userId to match the schema
      },
      include: {
        testGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate feedback by emotion
    const feedbackByEmotion: Record<string, number> = {};
    feedbackItems.forEach((item) => {
      const emotion = item.emotion || 'neutral';
      feedbackByEmotion[emotion] = (feedbackByEmotion[emotion] || 0) + 1;
    });

    // Calculate feedback by test group
    const feedbackByTestGroup = Object.values(
      feedbackItems.reduce((acc: Record<string, any>, item) => {
        const groupId = item.testGroup.id;
        if (!acc[groupId]) {
          acc[groupId] = {
            id: groupId,
            name: item.testGroup.name,
            count: 0,
          };
        }
        acc[groupId].count += 1;
        return acc;
      }, {})
    );

    // Format recent feedback
    const recentFeedback = feedbackItems.slice(0, 5).map((item) => ({
      id: item.id,
      content: item.comment,
      emotion: item.emotion,
      testGroupId: item.testGroup.id,
      testGroupName: item.testGroup.name,
      createdAt: item.createdAt.toISOString(),
    }));

    return res.status(200).json({
      totalFeedbackCount: feedbackItems.length,
      feedbackByEmotion,
      feedbackByTestGroup,
      recentFeedback,
    });
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    return res.status(500).json({ error: 'Failed to fetch feedback summary' });
  }
} 