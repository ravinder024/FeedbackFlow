import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if user is an admin
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    const { userId, testGroupId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!testGroupId || typeof testGroupId !== 'string') {
      return res.status(400).json({ error: 'Invalid test group ID' });
    }

    // Check if user exists and is not already a moderator
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot modify admin role' });
    }

    // Check if test group exists
    const testGroup = await prisma.userTestGroup.findUnique({
      where: { id: testGroupId },
    });

    if (!testGroup) {
      return res.status(404).json({ error: 'Test group not found' });
    }

    // Start a transaction to update both user role and test group moderator
    const [updatedUser, moderatorMember] = await prisma.$transaction([
      // Update user role to moderator
      prisma.user.update({
        where: { id: userId },
        data: { role: 'MODERATOR' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      }),
      // Add user as test group moderator
      prisma.userTestGroupMember.upsert({
        where: {
          userId_testGroupId: {
            userId,
            testGroupId,
          },
        },
        create: {
          userId,
          testGroupId,
          role: 'MODERATOR',
          invitedBy: session.user.id,
        },
        update: {
          role: 'MODERATOR',
        },
      }),
    ]);

    return res.status(200).json({
      user: updatedUser,
      moderatorMember,
    });
  } catch (error) {
    console.error('Error promoting user to moderator:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 