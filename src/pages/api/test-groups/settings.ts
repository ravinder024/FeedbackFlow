import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { UserRole } from '@/types/roles';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow PUT method
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { allowPublicJoin, requireApproval, maxMembers, notificationEmail } = req.body;

    // Validate settings
    if (typeof allowPublicJoin !== 'boolean' || typeof requireApproval !== 'boolean') {
      return res.status(400).json({ error: 'Invalid boolean settings' });
    }

    if (!Number.isInteger(maxMembers) || maxMembers < 1) {
      return res.status(400).json({ error: 'Invalid maximum members value' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(notificationEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Update user settings in the database
    // Note: You'll need to add a UserSettings model to your Prisma schema
    const settings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        allowPublicJoin,
        requireApproval,
        maxMembers,
        notificationEmail,
      },
      create: {
        userId: session.user.id,
        allowPublicJoin,
        requireApproval,
        maxMembers,
        notificationEmail,
      },
    });

    return res.status(200).json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
} 