import { NextApiRequest, NextApiResponse } from 'next';
import { mockInviteAttempts, mockTestGroups, MockInvite } from './mock-data';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { emails, testGroupId } = req.body || {};

    const idFromQuery = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
    const id = testGroupId || idFromQuery;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid test group ID' });
    }

    if (!emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Invalid emails array' });
    }

    console.log(`API: Sending invites for test group ${id} to:`, emails);

    // Create invites and persist them on the mock test group so the manage UI can read them
    const invites: MockInvite[] = emails.map((email: string) => {
      const inv: MockInvite = {
        id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        testGroupId: id,
        email,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        token: `token-${Math.random().toString(36).substr(2, 16)}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days
      };
      return inv;
    });

    // Persist on global mock store
    mockInviteAttempts.push(...invites);

    // Attach to mock test group
    const group = mockTestGroups.find(g => g.id === id);
    if (group) {
      group.pendingInvitations = group.pendingInvitations.concat(invites);
    }

    console.log(`API: Mock invites recorded:`, invites.length);

    return res.status(200).json({ 
      success: true,
      message: `${invites.length} invitations recorded (dev)`,
      invites: invites.map(inv => ({ id: inv.id, email: inv.email, status: inv.status }))
    });

  } catch (error) {
    console.error('Error sending invites:', error);
    return res.status(500).json({ 
      error: 'Failed to send invitations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
