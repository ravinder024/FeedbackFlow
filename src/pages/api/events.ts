import { NextApiRequest, NextApiResponse } from 'next';
import { EventLogger, EVENT_TYPES, USER_ACTIONS } from '@/lib/event-logger';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';

// Allow any string for event type (dev mode)
type ParsedBehaviorEvent = {
  type: string;
  element?: string; // Optional for navigation events
  page: string;
  subtype?: string; // Optional for navigation subtype (page_load, route_change)
  session_id?: string; // Optional session ID for grouping events
  previous_events?: Array<{ type: string; element?: string; page: string; timestamp: number }>; // Rolling context for rage/dead clicks
  timestamp: Date;
};

function parseBehaviorEvent(raw: unknown): { event?: ParsedBehaviorEvent; error?: string } {
  if (!raw || typeof raw !== 'object') {
    return { error: 'event must be an object' };
  }

  const candidate = raw as {
    type?: unknown;
    element?: unknown;
    page?: unknown;
    subtype?: unknown;
    session_id?: unknown;
    previous_events?: unknown;
    timestamp?: unknown;
  };

  // Allow any non-empty string for type (dev mode)
  if (typeof candidate.type !== 'string' || candidate.type.trim().length === 0) {
    return { error: 'type must be a non-empty string' };
  }

  // Element is now optional (navigation events don't have element)
  const element = typeof candidate.element === 'string' ? candidate.element : undefined;

  if (typeof candidate.page !== 'string' || candidate.page.trim().length === 0) {
    return { error: 'page must be a non-empty string' };
  }

  // Subtype is optional (for navigation: page_load or route_change)
  const subtype = typeof candidate.subtype === 'string' ? candidate.subtype : undefined;

  // Session ID is optional (for grouping events across a session)
  const session_id = typeof candidate.session_id === 'string' ? candidate.session_id : undefined;

  // Previous events context is optional (attached to rage_click/dead_click)
  let previous_events: Array<{ type: string; element?: string; page: string; timestamp: number }> | undefined;
  if (Array.isArray(candidate.previous_events)) {
    previous_events = candidate.previous_events
      .filter((e): e is { type: string; page: string; timestamp: number; element?: string } =>
        !!e && typeof e === 'object' &&
        typeof (e as { type?: unknown }).type === 'string' &&
        typeof (e as { page?: unknown }).page === 'string' &&
        typeof (e as { timestamp?: unknown }).timestamp === 'number'
      )
      .slice(0, 10); // Hard cap at 10 to prevent abuse
  }

  let timestamp: Date;
  if (typeof candidate.timestamp === 'number') {
    timestamp = new Date(candidate.timestamp);
  } else if (typeof candidate.timestamp === 'string') {
    timestamp = new Date(candidate.timestamp);
  } else {
    // If missing, use now
    timestamp = new Date();
  }

  if (Number.isNaN(timestamp.getTime())) {
    return { error: 'timestamp is invalid' };
  }

  return {
    event: {
      type: candidate.type,
      element, // Now optional
      page: candidate.page,
      subtype, // Now optional
      session_id, // Now optional
      previous_events, // Only present for rage_click/dead_click
      timestamp,
    },
  };
}

// Helper function to map event types to user actions
function getActionFromEventType(eventType: string): string {
  switch (eventType) {
    case EVENT_TYPES.FEEDBACK_SUBMITTED:
      return USER_ACTIONS.FEEDBACK_SUBMIT;
    default:
      return USER_ACTIONS.EVENT_CREATE;
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

      // Part 1 behavior tracking payload: { events: [{ type, element, page, timestamp, ... }], ... }
      if (Array.isArray(body?.events)) {
        if (body.events.length === 0) {
          return res.status(400).json({ error: 'events must contain at least one event' });
        }

        const parsedEvents: ParsedBehaviorEvent[] = [];

        for (let i = 0; i < body.events.length; i += 1) {
          const { event, error } = parseBehaviorEvent(body.events[i]);
          if (!event) {
            return res.status(400).json({
              error: `Invalid behavior event at index ${i}: ${error || 'unknown error'}`,
            });
          }
          parsedEvents.push(event);
        }

        await prisma.event.createMany({
          data: parsedEvents.map((event) => ({
            id: randomUUID(),
            type: event.type,
            element: event.element,
            page: event.page,
            subtype: event.subtype,
            session_id: event.session_id,
            previous_events: event.previous_events ?? undefined,
            timestamp: event.timestamp,
          })),
        });

        return res.status(200).json({
          success: true,
          insertedCount: parsedEvents.length,
        });
      }
      

      // Accept direct event payloads for dev: { type, page, ... }
      // element is optional (navigation events don't have element)
      if (body.type && body.page) {
        const { event, error } = parseBehaviorEvent(body);
        if (!event) {
          return res.status(400).json({ error });
        }
        await prisma.event.create({
          data: {
            id: randomUUID(),
            type: event.type,
            element: event.element,
            page: event.page,
            subtype: event.subtype,
            session_id: event.session_id,
            previous_events: event.previous_events ?? undefined,
            timestamp: event.timestamp,
          },
        });
        return res.status(200).json({ success: true, insertedCount: 1 });
      }

      // ...existing code for legacy/complex formats...
      let eventType, data, type;
      if (body.eventType) {
        eventType = body.eventType;
        data = body.data || {};
        type = 'event';
      } else if (body.type) {
        type = body.type;
        data = body.data || {};
        eventType = data.eventType;
      } else {
        return res.status(400).json({ 
          error: 'Invalid request format. Expected eventType or type and data.' 
        });
      }

      let result;
      switch (type) {
        case 'event':
          result = await EventLogger.logEvent({
            eventType: eventType || EVENT_TYPES.FEEDBACK_SUBMITTED,
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
          await EventLogger.logUserActivity({
            userId,
            sessionId: data.sessionId || session?.user?.id || 'anonymous-session',
            action: getActionFromEventType(eventType),
            metadata: {
              eventType,
              pageUrl: data.pageUrl
            },
            ipAddress: ip,
            userAgent: req.headers['user-agent'],
          });
          break;
        case 'activity':
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
        source = 'legacy', // 'legacy' for EventLog, 'behavior' for events table
        userId: queryUserId,
        testGroupId,
        eventType,
        type: typeFilter,
        element: elementFilter,
        page: pageFilter,
        startDate,
        endDate,
        limit = '50',
        offset = '0'
      } = req.query;

      // Retrieve behavior events from the events table
      if (source === 'behavior') {
        const where: any = {};

        if (typeFilter) where.type = typeFilter;
        if (elementFilter) where.element = elementFilter;
        if (pageFilter) where.page = pageFilter;
        if (startDate || endDate) {
          where.timestamp = {};
          if (startDate) where.timestamp.gte = new Date(startDate as string);
          if (endDate) where.timestamp.lte = new Date(endDate as string);
        }

        const [events, totalCount] = await Promise.all([
          prisma.event.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit as string, 10),
            skip: parseInt(offset as string, 10),
          }),
          prisma.event.count({ where }),
        ]);

        return res.status(200).json({
          success: true,
          data: events,
          pagination: {
            total: totalCount,
            limit: parseInt(limit as string, 10),
            offset: parseInt(offset as string, 10),
          },
        });
      }

      // Legacy EventLog retrieval (original logic)
      // If testGroupId is not provided, fall back to behavior events
      if (!testGroupId) {
        // Return behavior events (no testGroupId required)
        const where: any = {};

        if (typeFilter) where.type = typeFilter;
        if (elementFilter) where.element = elementFilter;
        if (pageFilter) where.page = pageFilter;
        if (startDate || endDate) {
          where.timestamp = {};
          if (startDate) where.timestamp.gte = new Date(startDate as string);
          if (endDate) where.timestamp.lte = new Date(endDate as string);
        }

        const [events, totalCount] = await Promise.all([
          prisma.event.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit as string, 10),
            skip: parseInt(offset as string, 10),
          }),
          prisma.event.count({ where }),
        ]);

        return res.status(200).json({
          success: true,
          data: events,
          pagination: {
            total: totalCount,
            limit: parseInt(limit as string, 10),
            offset: parseInt(offset as string, 10),
          },
        });
      }

      // Construct the where clause for EventLog when testGroupId IS provided
      const where: any = { testGroupId };

      if (queryUserId) where.userId = queryUserId;
      if (eventType) where.eventType = eventType;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate as string);
        if (endDate) where.timestamp.lte = new Date(endDate as string);
      }

      // Log the constructed where clause for debugging (dev only)
      if (process.env.NODE_ENV !== 'production') {
        console.log('DB WHERE CLAUSE:', where);
      }

      const legacyEvents = await EventLogger.getEvents({
        ...where,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });

      res.status(200).json({ success: true, ...legacyEvents });

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
