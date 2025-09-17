import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { sendTestGroupInvitation } from '@/lib/email';
import { generateToken } from '@/lib/tokens';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testGroupId, emails, role } = req.body;

    if (!testGroupId || !emails || !Array.isArray(emails) || !role) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Map roles to TestGroupRole enum values
    const mappedRole = role === 'TEST_MEMBER' || role === 'MEMBER' ? 'MEMBER' : 'MODERATOR';

    console.log('Invitations API: role mapping', { inputRole: role, mappedRole });

    // Verify the user has permission to invite to this test group
    const testGroup = await prisma.testGroup.findFirst({
      where: {
        id: testGroupId,
        OR: [
          { moderatorId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                role: 'MODERATOR',
              },
            },
          },
        ],
      },
      include: {
        moderator: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!testGroup) {
      return res.status(403).json({ error: 'You do not have permission to invite members to this test group' });
    }

    const results = await Promise.all(
      emails.map(async (email: string) => {
        try {
          // Generate invitation token
          const token = generateToken();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

          // Create or update invitation record to avoid duplicate constraint errors
          let invitation;
          try {
            invitation = await prisma.testGroupInvitation.upsert({
              where: {
                email_testGroupId: {
                  email,
                  testGroupId,
                },
              },
              create: {
                email,
                token,
                role: mappedRole,
                expiresAt,
                testGroupId,
              },
              update: {
                // Only allow re-sending if the previous invitation has not been accepted yet
                ...(mappedRole ? { role: mappedRole } : {}),
                token,
                expiresAt,
                acceptedAt: null,
                acceptedById: null,
              },
            });
          } catch (prismaError) {
            // If the existing invitation has already been accepted we don't want to send another one.
            if (
              prismaError instanceof Error &&
              prismaError.name === 'PrismaClientKnownRequestError' &&
              (prismaError as any).code === 'P2002'
            ) {
              console.warn(`Invitation already exists and was already accepted for ${email}`);
              return { email, status: 'failed', error: 'User already invited or joined' };
            }
            throw prismaError;
          }

          // Send invitation email
          try {
            await sendTestGroupInvitation(
              email,
              `${process.env.NEXTAUTH_URL}/join-test-group?token=${token}`,
              testGroup.name,
              session.user.name || 'A moderator',
              testGroup.domain,
              role,
              expiresAt
            );
            return { email, status: 'success' };
          } catch (emailError) {
            // If email fails, delete the invitation record
            await prisma.testGroupInvitation.delete({
              where: { id: invitation.id }
            });
            throw emailError;
          }
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
          return { 
            email, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error : undefined
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'failed');

    if (failed.length > 0) {
      return res.status(400).json({
        error: 'Some invitations failed',
        message: `Successfully sent ${successful.length} invitation(s), ${failed.length} failed`,
        results,
      });
    }

    return res.status(200).json({
      message: `Successfully sent ${successful.length} invitation(s)`,
      results,
    });
  } catch (error) {
    console.error('Invitation error:', error);
    return res.status(500).json({ error: 'Failed to send invitations' });
  }
} 