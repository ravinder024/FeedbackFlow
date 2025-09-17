import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authenticated user
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const testGroupId = req.query.id as string;

    if (!testGroupId) {
      return res.status(400).json({ error: 'Test group ID is required' });
    }

    // Fetch the test group
    const testGroup = await prisma.testGroup.findUnique({
      where: { id: testGroupId },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!testGroup) {
      return res.status(404).json({ error: 'Test group not found' });
    }

    // Check if the user is a member of the test group or has admin/moderator privileges
    const isMember = testGroup.members.length > 0;
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isModerator = session.user.role === UserRole.MODERATOR || isAdmin;

    if (!isMember && !isModerator) {
      return res.status(403).json({ error: 'You are not authorized to access this test group' });
    }

    // Generate a JWT token for widget authentication
    // In a production environment, use a proper secret key from environment variables
    const secret = process.env.JWT_SECRET || 'feedbackflow-widget-secret-key';
    
    const token = jwt.sign(
      {
        userId: session.user.id,
        testGroupId: testGroup.id,
        domain: testGroup.domain,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hour expiration
      },
      secret
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error generating widget token:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 