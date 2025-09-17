import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const { isActive } = req.body;

  if (!id || typeof id !== 'string' || typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    // Check if user is moderator of the test group
    const testGroup = await prisma.testGroup.findFirst({
      where: {
        id,
        moderatorId: session.user.id,
      },
    });

    if (!testGroup) {
      return res.status(404).json({ error: 'Test group not found or you do not have permission' });
    }

    // Update test group status
    const updatedTestGroup = await prisma.testGroup.update({
      where: { id },
      data: { isActive },
      include: {
        moderator: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            testSessions: true,
          },
        },
      },
    });

    // If setting to inactive, end all active test sessions
    if (!isActive) {
      await prisma.testSession.updateMany({
        where: {
          testGroupId: id,
          status: 'ACTIVE',
        },
        data: {
          status: 'CANCELLED',
          endedAt: new Date(),
        },
      });
    }

    return res.status(200).json(updatedTestGroup);
  } catch (error) {
    console.error('Error updating test group status:', error);
    return res.status(500).json({ error: 'Failed to update test group status' });
  }
} 