import { NextApiRequest, NextApiResponse } from 'next';
import { getIssues, getIssueCount, getLastUpdateTime, type StoredIssue } from '@/lib/tracking/issue-store';

/**
 * GET /api/issues
 *
 * Returns all stored issues, sorted by criteria (default: severity → frequency → timestamp).
 *
 * Query parameters:
 *   sort: 'severity' | 'frequency' | 'timestamp' (default: severity)
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   data: StoredIssue[],
 *   count: number,
 *   lastUpdated: ISO 8601 string | null
 * }
 *
 * Error (405):
 * {
 *   error: 'Method not allowed'
 * }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sort } = req.query;
    const sortBy = (
      typeof sort === 'string' && ['severity', 'frequency', 'timestamp'].includes(sort)
        ? (sort as 'severity' | 'frequency' | 'timestamp')
        : undefined
    );

    const issues = getIssues(sortBy);
    const count = getIssueCount();
    const lastUpdated = getLastUpdateTime();

    // Convert dates to ISO strings for JSON serialization
    const serialized = issues.map((issue) => ({
      ...issue,
      timestamp: issue.timestamp.toISOString(),
      last_seen: issue.last_seen?.toISOString() || null,
    }));

    return res.status(200).json({
      success: true,
      data: serialized,
      count,
      lastUpdated: lastUpdated?.toISOString() || null,
    });
  } catch (error) {
    console.error('Issues API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
