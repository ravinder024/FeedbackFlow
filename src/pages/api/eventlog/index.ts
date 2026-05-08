import { NextApiRequest, NextApiResponse } from 'next';
import { EventLogger, EVENT_TYPES } from '@/lib/event-logger';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const {
        eventType,
        userId,
        pageUrl,
        x,
        y,
        emoji,
        severity,
        comment,
        metadata,
        testGroupId
      } = req.body;

      // Convert old format to new format
      const data: any = {};
      if (x !== undefined) data.x = parseFloat(x);
      if (y !== undefined) data.y = parseFloat(y);
      if (emoji) data.emoji = emoji;
      if (severity) data.severity = severity;
      if (comment) data.comment = comment;
      if (metadata) data.metadata = metadata;

      const eventLog = await EventLogger.logEvent({
        eventType: eventType || EVENT_TYPES.FEEDBACK_SUBMITTED,
        userId,
        pageUrl,
        testGroupId,
        data
      });

      res.status(201).json(eventLog);
    } catch (error) {
      console.error('Error creating event log:', error);
      res.status(500).json({ error: 'Failed to create event log' });
    }
  } else if (req.method === 'GET') {
    try {
      const { 
        pageUrl, 
        userId,
        testGroupId,
        eventType,
        startDate,
        endDate,
        limit = 100, 
        offset = 0 
      } = req.query;

      const result = await EventLogger.getEvents({
        userId: userId as string,
        testGroupId: testGroupId as string,
        eventType: eventType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      res.status(200).json({
        eventLogs: result.events,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching event logs:', error);
      res.status(500).json({ error: 'Failed to fetch event logs' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
