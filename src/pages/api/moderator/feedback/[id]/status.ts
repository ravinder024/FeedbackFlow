import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { SessionStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const { status } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  if (!status || !Object.values(SessionStatus).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Get the test session to check test group
    const testSession = await prisma.testSession.findUnique({
      where: { id },
      select: {
        testGroupId: true,
      },
    });

    if (!testSession) {
      return res.status(404).json({ error: 'Test session not found' });
    }

    // Check if user is a moderator for this test group
    const moderator = await prisma.userTestGroupMember.findFirst({
      where: {
        testGroupId: testSession.testGroupId,
        userId: session.user.id,
        role: 'MODERATOR',
      },
    });

    if (!moderator) {
      return res.status(403).json({ error: 'Not authorized as moderator' });
    }

    // Update session status
    const updatedSession = await prisma.testSession.update({
      where: { id },
      data: { 
        status,
        endedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        feedback: {
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
        },
      },
    });

    return res.status(200).json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating session status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 