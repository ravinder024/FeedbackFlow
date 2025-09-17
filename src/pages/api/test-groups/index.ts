import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { sendTestGroupCreationConfirmation } from '@/lib/email';
import { UserRole, TestGroupRole } from '@/types/roles';
import { TestGroupResponse, TestGroupMember, TestGroupFeedback } from '@/types/test-group';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Handle POST request (Create new test group)
  if (req.method === 'POST') {
    // Only moderators and admins can create test groups
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      return res.status(403).json({ error: 'Only moderators can create test groups' });
    }

    try {
      const { name, description, domain } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      if (!domain) {
        return res.status(400).json({ error: 'Domain is required' });
      }

      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        return res.status(400).json({ error: 'Invalid domain format' });
      }

      const testGroup = await prisma.testGroup.create({
        data: {
          name,
          description,
          domain,
          moderatorId: session.user.id,
          members: {
            create: {
              userId: session.user.id,
              role: TestGroupRole.MODERATOR,
            },
          },
        },
        include: {
          moderator: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              members: true,
              sessions: true,
            },
          },
        },
      });

      // Send confirmation email
      if (session.user.email) {
        try {
          await sendTestGroupCreationConfirmation(
            session.user.email,
            testGroup.name,
            testGroup.id
          );
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the request if email fails
        }
      }

      return res.status(201).json(testGroup);
    } catch (error) {
      console.error('Error creating test group:', error);
      return res.status(500).json({ error: 'Failed to create test group' });
    }
  }

  // Handle GET request (List test groups)
  if (req.method === 'GET') {
    try {
      // Get the time threshold for active sessions (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Different queries based on user role
      let testGroups;

      if (user.role === UserRole.TEST_MEMBER) {
        // For test members, only return groups they are members of
        testGroups = await prisma.testGroup.findMany({
          where: {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
          include: {
            moderator: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
            members: {
              select: {
                id: true,
                userId: true,
                role: true,
                joinedAt: true,
              },
            },
            // Remove feedback include, not a direct relation on TestGroup
            _count: {
              select: {
                members: true,
                sessions: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        // For moderators and admins, return groups they have access to
        const testGroups = await prisma.testGroup.findMany({
          where: user.role === UserRole.ADMIN 
            ? {} // Admin can see all groups
            : { moderatorId: session.user.id }, // Moderators see only their groups
          include: {
            moderator: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
            members: {
              select: {
                id: true,
                userId: true,
                role: true,
                joinedAt: true,
              },
            },
            sessions: {
              select: {
                id: true,
                status: true,
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
            createdAt: 'desc',
          },
        }) as unknown as TestGroupResponse[];
      }

      // Format the response to include active members count and feedback stats
      const formattedGroups = (testGroups ?? []).map(group => {
        // Count recently active members (joined in the last 7 days)
        const activeMembers = Array.isArray(group.members)
          ? group.members.filter((member: any) => new Date(member.joinedAt) > lastWeek).length
          : 0;
        
        // Count pending feedback
        let pendingFeedback = 0;
        if (Array.isArray(group.sessions)) {
          pendingFeedback = group.sessions.flatMap((session: any) => Array.isArray(session.feedback) ? session.feedback : []).filter((feedback: any) => feedback.status === 'TODO' || feedback.status === 'IN_PROGRESS').length;
        }
        
        return {
          id: group.id,
          name: group.name,
          description: group.description || '',
          memberCount: group._count?.members ?? 0,
          activeMembers,
          pendingFeedback,
          totalFeedback: Array.isArray(group.sessions)
            ? group.sessions.reduce((sum: number, session: any) => sum + (Array.isArray(session.feedback) ? session.feedback.length : 0), 0)
            : 0,
          domain: group.domain || '',
          moderator: {
            name: group.moderator?.name || '',
            email: group.moderator?.email || '',
            image: group.moderator?.image || null
          },
          createdAt: group.createdAt,
        };
      });

      return res.status(200).json(formattedGroups);
    } catch (error) {
      console.error('Error fetching test groups:', error);
      return res.status(500).json({ error: 'Failed to fetch test groups' });
    }
  }

  // Handle unsupported methods
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
} 