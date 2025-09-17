import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { render } from '@react-email/render';
import React from 'react';
import { TestGroupInvitationEmail, renderTestGroupInvitationEmail } from '@/emails/TestGroupInvitation';
import { sendTestGroupInvitation } from '@/lib/email';
import { Role, TestGroupRole } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token } = req.body;

  try {
    // Find and validate invitation
    const invitation = await prisma.testGroupInvitation.findUnique({
      where: { token },
      include: {
        testGroup: {
          include: {
            moderator: true,
          },
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    if (invitation.acceptedById) {
      return res.status(400).json({ error: 'Invitation has already been used' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    // If user doesn't exist but the session user's email matches the invitation email,
    // we'll use the session user
    if (!user && session.user.email === invitation.email) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
    }

    if (!user) {
      // Create a new user if one doesn't exist
      user = await prisma.user.create({
        data: {
          email: invitation.email,
          name: session.user.name || invitation.email.split('@')[0],
          role: 'TEST_MEMBER', // Set role to TEST_MEMBER
        },
      });
    } else {
      // Update existing user's role to TEST_MEMBER if they don't have a higher role
      if (user.role !== 'ADMIN' && user.role !== 'MODERATOR') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'TEST_MEMBER' as Role },
        });
      }
    }

    // Check if user is already a member of the test group
    const existingMembership = await prisma.testGroupMember.findFirst({
      where: {
        userId: user.id,
        testGroupId: invitation.testGroupId,
      },
    });

    if (!existingMembership) {
      // Add user to test group
      await prisma.testGroupMember.create({
        data: {
          userId: user.id,
          testGroupId: invitation.testGroupId,
          role: invitation.role,
        },
      });
    }

    // Mark invitation as accepted
    await prisma.testGroupInvitation.update({
      where: { id: invitation.id },
      data: {
        acceptedById: user.id,
        acceptedAt: new Date(),
      },
    });

    // Log the event for debugging
    console.log(`User ${user.id} (${user.email}) accepted invitation to group ${invitation.testGroupId}`);

    // Send notification email
    try {
      await sendTestGroupInvitation(
        invitation.testGroup.moderator.email!,
        `${process.env.NEXT_PUBLIC_APP_URL}/test-groups/${invitation.testGroupId}`,
        invitation.testGroup.name,
        user.name || user.email,
        invitation.testGroup.domain,
        'MEMBER', // Role as string instead of enum
        invitation.expiresAt
      );
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Continue anyway, don't fail the request
    }

    return res.status(200).json({
      message: 'Successfully joined test group',
      testGroupId: invitation.testGroupId,
      userId: user.id,
      role: user.role,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({ error: 'Failed to accept invitation' });
  }
} 