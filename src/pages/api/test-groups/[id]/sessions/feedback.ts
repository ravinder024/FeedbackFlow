import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid test group ID' });
  }

  if (req.method === 'POST') {
    try {
      const { sessionId, content, rating, category } = req.body;

      // Validate required fields
      if (!sessionId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify test session exists and belongs to the test group
      const testSession = await prisma.testSession.findFirst({
        where: {
          id: sessionId,
          testGroupId: id,
          status: 'ACTIVE',
        },
      });

      if (!testSession) {
        return res.status(404).json({ error: 'Test session not found or not active' });
      }

      // Create feedback
      const feedback = await prisma.testFeedback.create({
        data: {
          sessionId,
          userId: session.user.id,
          content,
          rating: rating ? parseInt(rating) : null,
          category,
        },
      });

      return res.status(201).json(feedback);
    } catch (error) {
      console.error('Error creating feedback:', error);
      return res.status(500).json({ error: 'Failed to create feedback' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { sessionId } = req.query;

      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      // Verify user has access to the test group
      const membership = await prisma.testGroupMember.findFirst({
        where: {
          userId: session.user.id,
          testGroupId: id,
        },
      });

      if (!membership) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Fetch feedback for the session
      const feedback = await prisma.testFeedback.findMany({
        where: {
          sessionId: sessionId as string,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(feedback);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 