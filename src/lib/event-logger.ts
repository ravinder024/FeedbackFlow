/**
 * Event Logging Service
 * 
 * Provides centralized event logging for user actions and system events
 * with proper performance considerations and data privacy compliance.
 */

import { prisma } from './prisma';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';

export interface EventLogData {
  eventType: string;
  pageUrl?: string;
  userId?: string;
  testGroupId?: string;
  data?: Record<string, any>;
}

export interface UserActivityData {
  userId: string;
  sessionId?: string;
  action: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class EventLogger {
  /**
   * Log a system event.
   */
  static async logEvent(data: EventLogData) {
    try {
      return await prisma.eventLog.create({
        data: {
          eventType: data.eventType,
          pageUrl: data.pageUrl,
          userId: data.userId,
          testGroupId: data.testGroupId,
          data: data.data,
        },
      });
    } catch (error) {
      console.error('Failed to log event:', error);
      // Don't throw - logging should not break the main flow
      return null;
    }
  }

  /**
   * Log user activity with privacy-compliant IP anonymization
   */
  static async logUserActivity(data: UserActivityData) {
    try {
      return await prisma.userActivity.create({
        data: {
          userId: data.userId,
          sessionId: data.sessionId || randomUUID(),
          action: data.action,
          metadata: data.metadata,
          ipAddress: this.anonymizeIP(data.ipAddress),
          userAgent: this.anonymizeUserAgent(data.userAgent),
        },
      });
    } catch (error) {
      console.error('Failed to log user activity:', error);
      // Don't throw - logging should not break the main flow
      return null;
    }
  }

  /**
   * Get event logs with filtering and pagination
   */
  static async getEvents(options: {
    userId?: string;
    testGroupId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      userId,
      testGroupId,
      eventType,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = options;

    const where: any = {};

    if (userId) where.userId = userId;
    if (testGroupId) where.testGroupId = testGroupId;
    if (eventType) where.eventType = eventType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [events, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.eventLog.count({ where }),
    ]);

    return {
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    };
  }

  /**
   * Get user activity logs with filtering and pagination
   */
  static async getUserActivity(options: {
    userId?: string;
    sessionId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}) {
    const {
      userId,
      sessionId,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = options;

    const where: any = {};

    if (userId) where.userId = userId;
    if (sessionId) where.sessionId = sessionId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const [activities, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.userActivity.count({ where }),
    ]);

    return {
      activities,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    };
  }

  /**
   * Get event statistics for dashboard/analytics
   */
  static async getEventStats(options: {
    testGroupId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const { testGroupId, startDate, endDate } = options;

    const where: any = {};
    if (testGroupId) where.testGroupId = testGroupId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    // Get event type counts
    const eventTypeCounts = await prisma.eventLog.groupBy({
      by: ['eventType'],
      where,
      _count: { eventType: true },
      orderBy: { _count: { eventType: 'desc' } },
    });

    // Get daily event counts for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyCounts = await prisma.$queryRaw`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM event_logs 
      WHERE timestamp >= ${thirtyDaysAgo}
        ${testGroupId ? Prisma.sql`AND "testGroupId" = ${testGroupId}` : Prisma.empty}
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    return {
      eventTypeCounts: eventTypeCounts.map(item => ({
        eventType: item.eventType,
        count: item._count.eventType,
      })),
      dailyCounts,
      totalEvents: eventTypeCounts.reduce((sum, item) => sum + item._count.eventType, 0),
    };
  }

  /**
   * Clean up old logs (for GDPR compliance and performance)
   */
  static async cleanupOldLogs(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const [deletedEvents, deletedActivities] = await Promise.all([
      prisma.eventLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      }),
      prisma.userActivity.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
        },
      }),
    ]);

    return {
      deletedEvents: deletedEvents.count,
      deletedActivities: deletedActivities.count,
      cutoffDate,
    };
  }

  /**
   * Anonymize IP address for privacy compliance (keep first 3 octets for IPv4)
   */
  private static anonymizeIP(ip?: string): string | undefined {
    if (!ip) return undefined;

    // IPv4 anonymization
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.XXX`;
      }
    }

    // IPv6 anonymization (keep first 64 bits)
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts.slice(0, 4).join(':')}::XXXX`;
      }
    }

    return 'XXX.XXX.XXX.XXX';
  }

  /**
   * Anonymize user agent (remove version specifics)
   */
  private static anonymizeUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;

    // Remove specific version numbers while keeping browser/OS info
    return userAgent
      .replace(/\d+\.\d+(\.\d+)?/g, 'X.X') // Replace version numbers
      .replace(/\([^)]*\)/g, '(...)') // Replace detailed system info
      .substring(0, 200); // Limit length
  }
}

// Event type constants for consistency
export const EVENT_TYPES = {
  // Session events
  SESSION_STARTED: 'SESSION_STARTED',
  SESSION_ENDED: 'SESSION_ENDED',

  // Test group events
  TEST_GROUP_CREATED: 'TEST_GROUP_CREATED',
  TEST_GROUP_UPDATED: 'TEST_GROUP_UPDATED',
  MEMBER_ADDED: 'MEMBER_ADDED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',

  // Feedback events
  FEEDBACK_SUBMITTED: 'FEEDBACK_SUBMITTED',
  FEEDBACK_RESOLVED: 'FEEDBACK_RESOLVED',
} as const;

// User activity constants
export const USER_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EVENT_CREATE: 'EVENT_CREATE',
  PAGE_VIEW: 'PAGE_VIEW',
  FEEDBACK_SUBMIT: 'FEEDBACK_SUBMIT',
} as const;
