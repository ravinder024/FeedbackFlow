import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { UserRole } from '@/types/roles';
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

    if (session.user.role !== UserRole.TEST_MEMBER) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { testGroupId } = req.body;

    if (!testGroupId) {
      return res.status(400).json({ error: 'Test group ID is required' });
    }

    // Verify user is a member of the test group
    const membership = await prisma.testGroupMember.findFirst({
      where: {
        userId: session.user.id,
        testGroupId: testGroupId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this test group' });
    }

    // Check if test group is active
    const testGroup = await prisma.testGroup.findUnique({
      where: { id: testGroupId }
    });

    if (!testGroup || testGroup.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Test group is not active' });
    }

    // Check for any existing active sessions
    const existingSession = await prisma.testingSession.findFirst({
      where: {
        userId: session.user.id,
        testGroupId: testGroupId,
        endTime: null
      }
    });

    if (existingSession) {
      return res.status(400).json({ 
        error: 'You already have an active session for this test group',
        sessionId: existingSession.id
      });
    }

    // Create new testing session
    const newSession = await prisma.testingSession.create({
      data: {
        userId: session.user.id,
        testGroupId: testGroupId,
        startTime: new Date(),
      }
    });

    return res.status(200).json({
      message: 'Testing session started successfully',
      sessionId: newSession.id
    });
  } catch (error) {
    console.error('Start session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 