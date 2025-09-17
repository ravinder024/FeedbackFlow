import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

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

    // Extract parameters
    const testGroupId = req.query.id as string;
  const { domain } = req.body;

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
      return res.status(403).json({ error: 'You are not authorized to start a test session for this group' });
    }

    // Check if domain matches the test group domain
    if (testGroup.domain !== domain) {
      return res.status(400).json({ error: 'Domain does not match test group domain' });
    }

         // Check for an existing active session
     let testSession = await prisma.testSession.findFirst({
       where: {
         testGroupId,
        startedById: session.user.id,
         endedAt: null,
         status: 'ACTIVE',
      },
    });

     // Create a new session if one doesn't exist
     if (!testSession) {
       testSession = await prisma.testSession.create({
      data: {
           testGroupId,
           startedById: session.user.id,
           status: 'ACTIVE',
           startedAt: new Date(),
      },
    });

       console.log(`Test session ${testSession.id} created for user ${session.user.id} in group ${testGroupId}`);
     } else {
       console.log(`Found existing test session ${testSession.id} for user ${session.user.id} in group ${testGroupId}`);
     }

    // Return the session data with additional context
    return res.status(200).json({
      id: testSession.id,
      testGroupId: testGroup.id,
      startedAt: testSession.startedAt,
      isActive: true,
      domain: testGroup.domain,
      sessionId: testSession.id,
    });

  } catch (error) {
    console.error('Error starting test session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 