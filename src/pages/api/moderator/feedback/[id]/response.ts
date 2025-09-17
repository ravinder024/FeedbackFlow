import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const { content } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid feedback ID' });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'Response content is required' });
  }

  try {
    // Get the feedback item to check test group
    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        testingSession: {
          select: {
            testGroupId: true,
          },
        },
      },
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Check if user is a moderator for this test group
    const moderator = await prisma.testGroupModerator.findFirst({
      where: {
        testGroupId: feedback.testingSession.testGroupId,
        userId: session.user.id,
      },
    });

    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized as moderator' });
    }

    // Add the response
    const response = await prisma.feedbackResponse.create({
      data: {
        content,
        feedbackId: id,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(201).json({ response });
  } catch (error) {
    console.error('Error adding feedback response:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 