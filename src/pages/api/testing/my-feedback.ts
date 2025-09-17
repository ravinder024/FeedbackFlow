import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { UserRole } from '@/types/roles';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get feedback with test group information
    const feedback = await prisma.testFeedback.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        session: {
          include: {
            testGroup: {
              select: {
                name: true,
                domain: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await prisma.testFeedback.count({
      where: {
        userId: session.user.id
      }
    });

    // Format the response
    const formattedFeedback = feedback.map(item => ({
      id: item.id,
      content: item.content,
      rating: item.rating,
      category: item.category,
      qualityScore: item.qualityScore,
      createdAt: item.createdAt,
      testGroup: {
        name: item.session.testGroup.name,
        domain: item.session.testGroup.domain
      }
    }));

    return res.status(200).json({
      feedback: formattedFeedback,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Feedback history fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 