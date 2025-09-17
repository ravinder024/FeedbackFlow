import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Prisma, GroupStatus, MemberRole, SessionStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    // Get query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as GroupStatus | undefined;
    const search = req.query.search as string;

    // Build where clause
    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } as any },
          { domain: { contains: search, mode: 'insensitive' } as any },
          {
            moderator: {
              OR: [
                { name: { contains: search, mode: 'insensitive' } as any },
                { email: { contains: search, mode: 'insensitive' } as any },
              ],
            },
          },
        ],
      }),
    };

    // Get total count for pagination
    const total = await prisma.testGroup.count({ where });

    // Fetch test groups with related data
    const testGroups = await prisma.testGroup.findMany({
      where,
      include: {
        moderator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            role: true,
          },
        },
        sessions: {
          select: {
            status: true,
            _count: {
              select: {
                feedback: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate additional metrics for each test group
    const testGroupsWithMetrics = testGroups.map(group => {
      const memberCount = group._count.members;
      const moderatorCount = group.members.filter(m => m.role === MemberRole.MODERATOR).length;
      const sessionCount = group._count.sessions;
      const completedSessions = group.sessions.filter(s => s.status === SessionStatus.COMPLETED).length;
      const totalFeedback = group.sessions.reduce((sum, session) => sum + (session._count?.feedback || 0), 0);

      return {
        id: group.id,
        name: group.name,
        domain: group.domain,
        status: group.status,
        description: group.description,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
        moderator: group.moderator,
        metrics: {
          members: {
            total: memberCount,
            moderators: moderatorCount,
          },
          sessions: {
            total: sessionCount,
            completed: completedSessions,
            completionRate: sessionCount > 0 ? (completedSessions / sessionCount) * 100 : 0,
          },
          feedback: {
            total: totalFeedback,
            averagePerSession: sessionCount > 0 ? totalFeedback / sessionCount : 0,
          },
        },
      };
    });

    return res.status(200).json({
      testGroups: testGroupsWithMetrics,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching test groups:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}