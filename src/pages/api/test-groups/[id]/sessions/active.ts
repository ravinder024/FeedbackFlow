import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { SessionStatus } from '@/types/roles';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    // Check if user is a member of the test group
    const membership = await prisma.testGroupMember.findFirst({
      where: {
        testGroupId: id,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this test group' });
    }

    // Find active session for this user and test group
    const activeSession = await prisma.testSession.findFirst({
      where: {
        testGroupId: id,
        startedById: session.user.id,
        status: SessionStatus.ACTIVE,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (!activeSession) {
      return res.status(404).json({ error: 'No active session found' });
    }

    return res.status(200).json(activeSession);
  } catch (error) {
    console.error('Error checking for active session:', error);
    return res.status(500).json({ error: 'Failed to check for active session' });
  }
} 