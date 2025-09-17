import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    // Get total users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // Get total test groups and their status
    const testGroups = await prisma.testGroup.groupBy({
      by: ['isActive'],
      _count: true,
    });

    // Get total feedback count
    const totalFeedback = await prisma.testFeedback.count();

    // Get active test sessions
    const activeSessions = await prisma.testSession.count({
      where: {
        status: 'ACTIVE',
      },
    });

    // Get feedback trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const feedbackTrend = await prisma.$queryRaw<Array<{ date: Date; count: number }>>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "TestFeedback"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get average ratings across platform
    const ratings = await prisma.testFeedback.aggregate({
      where: {
        rating: {
          not: null,
        },
      },
      _avg: {
        rating: true,
        qualityScore: true,
      },
    });

    // Get test group creation trend
    const groupCreationTrend = await prisma.$queryRaw<Array<{ date: Date; count: number }>>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "TestGroup"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get system health metrics
    const totalTestSessions = await prisma.testSession.count();
    const completedSessions = await prisma.testSession.count({
      where: {
        status: 'COMPLETED',
      },
    });

    const sessionCompletionRate = totalTestSessions > 0 
      ? (completedSessions / totalTestSessions) * 100 
      : 0;

    return res.status(200).json({
      stats: {
        users: {
          byRole: usersByRole,
          total: usersByRole.reduce((acc, curr) => acc + (curr._count as any), 0),
        },
        testGroups: {
          byStatus: testGroups,
          total: testGroups.reduce((acc, curr) => acc + (curr._count as any), 0),
        },
        feedback: {
          total: totalFeedback,
          trend: feedbackTrend.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: Number(row.count),
          })),
          averageRating: ratings._avg.rating || 0,
          averageQualityScore: ratings._avg.qualityScore || 0,
        },
        sessions: {
          active: activeSessions,
          total: totalTestSessions,
          completionRate: sessionCompletionRate,
        },
        growth: {
          groupCreationTrend: groupCreationTrend.map(row => ({
            date: row.date.toISOString().split('T')[0],
            count: Number(row.count),
          })),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 