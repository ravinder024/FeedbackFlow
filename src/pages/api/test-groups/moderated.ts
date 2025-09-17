import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const testGroups = await prisma.testGroup.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
            role: 'MODERATOR',
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            testSessions: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    res.status(200).json(testGroups);
  } catch (error) {
    console.error('Error fetching moderated test groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 