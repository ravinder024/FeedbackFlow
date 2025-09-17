import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if user is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized as admin' });
    }

    const timeRange = req.query.timeRange as '24h' | '7d' | '30d' || '24h';
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      default: // 24h
        startDate.setDate(now.getDate() - 1);
    }

    // Get widget performance data
    const widgetLoadTimes = await prisma.$queryRaw<Array<{ date: Date; average: number; p95: number }>>`
      WITH widget_metrics AS (
        SELECT
          DATE_TRUNC('hour', created_at) as date,
          AVG(load_time) as average,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY load_time) as p95
        FROM widget_performance_logs
        WHERE created_at >= ${startDate}
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY date ASC
      )
      SELECT * FROM widget_metrics
    `;

    // Get widget errors
    const widgetErrors = await prisma.$queryRaw<Array<{ type: string; count: number }>>`
      SELECT
        error_type as type,
        COUNT(*) as count
      FROM widget_error_logs
      WHERE created_at >= ${startDate}
      GROUP BY error_type
    `;

    const widgetErrorTrend = await prisma.$queryRaw<Array<{ date: Date; count: number }>>`
      SELECT
        DATE_TRUNC('hour', created_at) as date,
        COUNT(*) as count
      FROM widget_error_logs
      WHERE created_at >= ${startDate}
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY date ASC
    `;

    // Get API request metrics
    const apiRequests = await prisma.$queryRaw<Array<{ endpoint: string; count: number; avgResponseTime: number }>>`
      SELECT
        endpoint,
        COUNT(*) as count,
        AVG(response_time) as "avgResponseTime"
      FROM api_request_logs
      WHERE created_at >= ${startDate}
      GROUP BY endpoint
    `;

    const apiRequestTrend = await prisma.$queryRaw<Array<{ date: Date; count: number }>>`
      SELECT
        DATE_TRUNC('hour', created_at) as date,
        COUNT(*) as count
      FROM api_request_logs
      WHERE created_at >= ${startDate}
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY date ASC
    `;

    // Get API errors
    const apiErrors = await prisma.$queryRaw<Array<{ statusCode: number; count: number }>>`
      SELECT
        status_code as "statusCode",
        COUNT(*) as count
      FROM api_error_logs
      WHERE created_at >= ${startDate}
      GROUP BY status_code
    `;

    // Calculate averages and totals
    const avgLoadTime = widgetLoadTimes.reduce((sum, entry) => sum + entry.average, 0) / widgetLoadTimes.length;
    const p95LoadTime = Math.max(...widgetLoadTimes.map(entry => entry.p95));
    const totalWidgetErrors = widgetErrors.reduce((sum, entry) => sum + entry.count, 0);
    const totalApiRequests = apiRequests.reduce((sum, entry) => sum + entry.count, 0);
    const totalApiErrors = apiErrors.reduce((sum, entry) => sum + entry.count, 0);

    return res.status(200).json({
      widget: {
        loadTime: {
          average: avgLoadTime || 0,
          p95: p95LoadTime || 0,
          trend: widgetLoadTimes.map(entry => ({
            date: entry.date.toISOString().split('T')[0],
            average: entry.average,
            p95: entry.p95,
          })),
        },
        errors: {
          total: totalWidgetErrors,
          byType: widgetErrors,
          trend: widgetErrorTrend.map(entry => ({
            date: entry.date.toISOString().split('T')[0],
            count: entry.count,
          })),
        },
      },
      api: {
        requests: {
          total: totalApiRequests,
          byEndpoint: apiRequests,
          trend: apiRequestTrend.map(entry => ({
            date: entry.date.toISOString().split('T')[0],
            count: entry.count,
          })),
        },
        errors: {
          total: totalApiErrors,
          byStatusCode: apiErrors,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching system health data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 