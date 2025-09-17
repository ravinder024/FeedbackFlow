import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { sign } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { testGroupId } = req.body;

    if (!testGroupId) {
      return res.status(400).json({ error: 'Test group ID is required' });
    }

    // Verify user is a member of the test group
    const membership = await prisma.userTestGroupMember.findFirst({
      where: {
        userId: session.user.id,
        testGroupId: testGroupId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this test group' });
    }

    // Generate a widget token
    const token = sign(
      {
        userId: session.user.id,
        testGroupId: testGroupId,
        type: 'widget_auth',
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
      },
      process.env.WIDGET_JWT_SECRET!
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Widget token generation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 