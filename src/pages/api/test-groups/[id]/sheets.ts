import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { setupSheetIntegration, exportFeedbackToSheet } from '@/lib/sheets';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid test group ID' });
  }

  // Check if user is a moderator for this test group
  const moderator = await prisma.testGroupMember.findFirst({
    where: {
      testGroupId: id,
      userId: session.user.id,
      role: 'MODERATOR',
    },
  });

  if (!moderator) {
    return res.status(403).json({ error: 'Not authorized as moderator' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'POST':
      // Setup or update integration
      try {
        const { sheetId, credentials } = req.body;

        if (!sheetId || !credentials) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        await setupSheetIntegration(id, sheetId, credentials);
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error setting up sheet integration:', error);
        return res.status(500).json({ error: 'Failed to setup sheet integration' });
      }

    case 'GET':
      // Get integration status
      try {
        const integration = await prisma.sheetIntegration.findUnique({
          where: { testGroupId: id },
        });

        return res.status(200).json({
          integration: integration ? {
            sheetId: integration.sheetId,
            lastSync: integration.lastSync,
            settings: {
              autoSync: integration.settings.autoSync,
              syncInterval: integration.settings.syncInterval,
            },
          } : null,
        });
      } catch (error) {
        console.error('Error fetching sheet integration:', error);
        return res.status(500).json({ error: 'Failed to fetch integration status' });
      }

    case 'PUT':
      // Trigger manual export
      try {
        await exportFeedbackToSheet(id);
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error exporting feedback:', error);
        return res.status(500).json({ error: 'Failed to export feedback' });
      }

    case 'DELETE':
      // Remove integration
      try {
        await prisma.sheetIntegration.delete({
          where: { testGroupId: id },
        });
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('Error removing sheet integration:', error);
        return res.status(500).json({ error: 'Failed to remove integration' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 