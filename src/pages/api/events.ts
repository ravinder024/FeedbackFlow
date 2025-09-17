import { NextApiRequest, NextApiResponse } from 'next';
import { EventLogger, EVENT_TYPES, USER_ACTIONS } from '@/lib/event-logger';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

// Helper function to map event types to user actions
function getActionFromEventType(eventType: string): string {
  switch (eventType) {
    case EVENT_TYPES.PIN_CREATED:
      return USER_ACTIONS.PIN_CREATE;
    case EVENT_TYPES.PIN_UPDATED:
      return USER_ACTIONS.PIN_EDIT;
    case EVENT_TYPES.PIN_DELETED:
      return USER_ACTIONS.PIN_EDIT;
    case EVENT_TYPES.COMMENT_ADDED:
      return USER_ACTIONS.COMMENT_CREATE;
    case EVENT_TYPES.FEEDBACK_SUBMITTED:
      return USER_ACTIONS.FEEDBACK_SUBMIT;
    default:
      return USER_ACTIONS.PAGE_VIEW;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id || 'anonymous';

    // Get client IP (with privacy considerations)
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;

    // Special handling for middleware requests
    const isMiddlewareRequest = req.headers['user-agent']?.includes('NextJS-Middleware');

    if (req.method === 'POST') {
      const body = req.body;
      
      // Handle both simple format and complex format
      let eventType, pinId, data, type;
      
      if (body.eventType && body.pinId) {
        // Simple format: { eventType, pinId, data }
        eventType = body.eventType;
        pinId = body.pinId;
        data = body.data || {};
        type = 'event';
      } else if (body.type) {
        // Complex format: { type, data: { eventType, pinId, ... } }
        type = body.type;
        data = body.data || {};
        eventType = data.eventType;
        pinId = data.pinId;
      } else {
        return res.status(400).json({ 
          error: 'Invalid request format. Expected eventType and pinId, or type and data.' 
        });
      }

      let result;

      switch (type) {
        case 'event':
          result = await EventLogger.logEvent({
            eventType: eventType || EVENT_TYPES.PIN_CREATED,
            pinId,
            pageUrl: data.pageUrl,
            userId,
            testGroupId: data.testGroupId || 'default-group',
            data: {
              ...data,
              timestamp: new Date().toISOString(),
              userAgent: req.headers['user-agent'],
              ipAddress: ip
            },
          });

          // Also log user activity for tracking
          await EventLogger.logUserActivity({
            userId,
            sessionId: data.sessionId || session?.user?.id || 'anonymous-session',
            action: getActionFromEventType(eventType),
            metadata: {
              pinId,
              eventType,
              pageUrl: data.pageUrl
            },
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
          });
          break;

        case 'activity':
          // For middleware requests, use the already anonymized IP
          const activityIP = isMiddlewareRequest ? data.ipAddress : ip;
          
          result = await EventLogger.logUserActivity({
            userId: data.userId || userId,
            sessionId: data.sessionId || 'unknown-session',
            action: data.action || USER_ACTIONS.PAGE_VIEW,
            metadata: data.metadata || {},
            ipAddress: activityIP,
            userAgent: data.userAgent || req.headers['user-agent'],
          });
          break;

        case 'get-events':
          result = await EventLogger.getEvents({
            pinId: data.pinId,
            userId: data.userId,
            testGroupId: data.testGroupId,
            eventType: data.eventType,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            limit: data.limit,
            offset: data.offset,
          });
          break;

        case 'get-activities':
          result = await EventLogger.getUserActivity({
            userId: data.userId,
            sessionId: data.sessionId,
            action: data.action,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            limit: data.limit,
            offset: data.offset,
          });
          break;

        case 'get-stats':
          result = await EventLogger.getEventStats({
            testGroupId: data.testGroupId,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
          });
          break;

        default:
          return res.status(400).json({ error: 'Invalid event type' });
      }

      res.status(200).json({ success: true, data: result });

    } else if (req.method === 'GET') {
      // Handle GET requests for retrieving events
      const {
        pinId,
        userId: queryUserId,
        testGroupId,
        eventType,
        startDate,
        endDate,
        limit = '50',
        offset = '0'
      } = req.query;

      const result = await EventLogger.getEvents({
        pinId: pinId as string,
        userId: queryUserId as string || userId,
        testGroupId: testGroupId as string,
        eventType: eventType as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });

      res.status(200).json({ success: true, ...result });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Event API error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
