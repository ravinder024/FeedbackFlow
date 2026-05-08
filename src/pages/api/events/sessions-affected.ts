import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '../auth/[...nextauth]';

/**
 * GET /api/events/sessions-affected?signature=<type>|<page>|<element>
 *
 * Returns the number of distinct sessions that have triggered an event
 * matching the given signature (type + page + element).
 *
 * Requires authentication.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { signature } = req.query;
  if (typeof signature !== 'string' || !signature) {
    return res.status(400).json({ error: 'signature query parameter is required' });
  }

  // Parse "type|page|element" — element may contain slashes but not pipes
  const idx1 = signature.indexOf('|');
  const idx2 = idx1 !== -1 ? signature.indexOf('|', idx1 + 1) : -1;

  if (idx1 === -1 || idx2 === -1) {
    return res.status(400).json({ error: 'signature must be in the format "type|page|element"' });
  }

  const type = signature.slice(0, idx1);
  const page = signature.slice(idx1 + 1, idx2);
  const element = signature.slice(idx2 + 1);

  if (!type || !page || !element) {
    return res.status(400).json({ error: 'signature must be in the format "type|page|element"' });
  }

  try {
    const events = await prisma.event.findMany({
      where: { type, page, element },
      select: { session_id: true },
    });

    const uniqueSessionIds = new Set(
      events.map((e) => e.session_id).filter((id): id is string => id !== null && id !== undefined),
    );

    return res.status(200).json({
      sessions_affected: uniqueSessionIds.size,
      signature,
    });
  } catch (error) {
    console.error('sessions-affected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
