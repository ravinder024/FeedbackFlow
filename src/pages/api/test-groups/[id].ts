import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/types/roles';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid test group ID' });
    }

    // Check if user has permission to manage this test group
    const testGroup = await prisma.testGroup.findUnique({
      where: { id },
    });

    if (!testGroup) {
      return res.status(404).json({ error: 'Test group not found' });
    }

    const hasPermission = 
      session.user.role === UserRole.ADMIN ||
      (session.user.role === UserRole.MODERATOR && testGroup.moderatorId === session.user.id);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, testGroup);
      case 'PUT':
        return handlePut(req, res, testGroup);
      case 'DELETE':
        return handleDelete(req, res, testGroup);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Unexpected error in test group handler:', error);

    // In development, return a mock test group so the dashboard remains usable
    if (process.env.NODE_ENV !== 'production') {
      const mock = {
        id: (req.query.id && typeof req.query.id === 'string') ? req.query.id : 'mock-group',
        name: 'Mock Test Group (dev fallback)',
        description: 'This is a fallback test group used during local development when the DB is unavailable.',
        domain: 'example.com',
        memberCount: 1,
        activeMembers: 1,
        pendingFeedback: 0,
        totalFeedback: 0,
        createdAt: new Date().toISOString(),
        userRole: 'MODERATOR',
      };

      return res.status(200).json(mock);
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  testGroup: any
) {
  try {
    // Get all test group members
    const allMembers = await prisma.testGroupMember.findMany({
      where: { testGroupId: testGroup.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Log all members for debugging
    console.log(`Found ${allMembers.length} members for test group ${testGroup.id}`);
    
    // Get group details
    const groupWithDetails = await prisma.testGroup.findUnique({
      where: { id: testGroup.id },
      include: {
        moderator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: { 
            members: true,
            widgetFeedback: true,
            sessions: true,
          },
        },
      },
    });

    // Count recent activity
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentActivity = await prisma.widgetFeedback.count({
      where: {
        testGroupId: testGroup.id,
        createdAt: {
          gte: lastWeek,
        },
      },
    });

    // Get pending invitations
    const pendingInvitations = await prisma.testGroupInvitation.findMany({
      where: {
        testGroupId: testGroup.id,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return res.json({
      ...groupWithDetails,
      members: allMembers,
      recentActivity,
      pendingInvitations,
      // Add dashboard-compatible fields
      memberCount: groupWithDetails?._count?.members || 0,
      activeMembers: allMembers.length,
      feedback: groupWithDetails?._count?.widgetFeedback || 0,
      totalFeedback: groupWithDetails?._count?.widgetFeedback || 0,
      resolvedPins: 0, // TODO: Calculate resolved pins
    });
  } catch (error) {
    console.error('Error fetching test group details:', error);
    return res.status(500).json({ error: 'Failed to fetch test group details' });
  }
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  testGroup: any
) {
  const { name, domain, description, settings, isActive } = req.body;
  const nextStatus = isActive === false ? 'INACTIVE' : 'ACTIVE';

  const updatedGroup = await prisma.testGroup.update({
    where: { id: testGroup.id },
    data: {
      name,
      domain,
      description,
      status: nextStatus,
    },
    include: {
      _count: {
        select: { members: true },
      },
    },
  });

  return res.json(updatedGroup);
}

async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse,
  testGroup: any
) {
  // Delete all related records first
  await prisma.$transaction([
    prisma.testGroupMember.deleteMany({
      where: { testGroupId: testGroup.id },
    }),
    prisma.testGroupInvitation.deleteMany({
      where: { testGroupId: testGroup.id },
    }),
    prisma.testGroup.delete({
      where: { id: testGroup.id },
    }),
  ]);

  return res.status(204).end();
} 