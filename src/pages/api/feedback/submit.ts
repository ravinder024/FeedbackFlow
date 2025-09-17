import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { validateDomain } from '@/lib/domain-validation';

interface TokenPayload {
  userId: string;
  testGroupId: string;
  type: string;
}

interface FeedbackSubmission {
  testGroupId: string;
  coordinates?: { xPercent: number; yPercent: number };
  x?: number;
  y?: number;
  emotion?: string;
  emoji?: string;
  severity?: string;
  comment: string;
  elementSelector?: string;
  url: string;
  timestamp?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Set CORS headers for widget support
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }
    
    const token = authHeader.substring(7);
    let tokenPayload: TokenPayload;

    try {
      tokenPayload = verify(token, process.env.WIDGET_JWT_SECRET!) as TokenPayload;
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const feedbackSubmission = req.body as FeedbackSubmission;
    
    // Validate domain 
    if (feedbackSubmission.url) {
      const isValidDomain = await validateDomain(feedbackSubmission.url, tokenPayload.testGroupId);
      if (!isValidDomain) {
        return res.status(400).json({ error: 'Invalid domain for test group' });
      }
    }

    // Check if this is a direct widget submission (has x,y) or session-based (has coordinates)
    const isWidgetSubmission = feedbackSubmission.x !== undefined && feedbackSubmission.y !== undefined;

    if (isWidgetSubmission) {
      // Handle direct widget feedback submission
      const { x, y, emoji, severity, comment } = feedbackSubmission;

      if (x === undefined || y === undefined) {
        return res.status(400).json({ error: 'Missing required fields: x, y' });
      }

      // Create feedback record
      const feedback = await prisma.widgetFeedback.create({
        data: {
          testGroupId: tokenPayload.testGroupId,
          submittedBy: tokenPayload.userId,
          url: feedbackSubmission.url,
          x: Math.round(x),
          y: Math.round(y),
          emoji: emoji || null,
          severity: severity || null,
          comment: comment || null,
          status: 'TODO',
          priority: severity === 'critical' ? 'HIGH' : 
                   severity === 'high' ? 'HIGH' :
                   severity === 'medium' ? 'MEDIUM' : 'LOW'
        }
      });

      console.log(`✅ Widget feedback submitted for test group ${tokenPayload.testGroupId}:`, {
        id: feedback.id,
        url: feedbackSubmission.url,
        position: { x, y },
        emoji,
        severity
      });

      return res.status(201).json({ 
        success: true, 
        feedbackId: feedback.id 
      });

    } else {
      // Handle session-based feedback submission (existing functionality)
      if (!feedbackSubmission.coordinates) {
        return res.status(400).json({ error: 'Missing coordinates for session feedback' });
      }

      // Get the active test session
      const activeSession = await prisma.testSession.findFirst({
        where: {
          testGroupId: tokenPayload.testGroupId,
          status: 'ACTIVE'
        },
        orderBy: {
          startTime: 'desc'
        }
      });

      if (!activeSession) {
        return res.status(404).json({ error: 'No active test session found' });
      }

      const submittedFeedback = await prisma.testFeedback.create({
        data: {
          sessionId: activeSession.id,
          userId: tokenPayload.userId,
          content: feedbackSubmission.comment,
          emotion: feedbackSubmission.emotion || feedbackSubmission.emoji,
          rating: null,
          qualityScore: null,
          metadata: {
            xPercent: feedbackSubmission.coordinates.xPercent,
            yPercent: feedbackSubmission.coordinates.yPercent,
            elementSelector: feedbackSubmission.elementSelector,
            url: feedbackSubmission.url,
            timestamp: feedbackSubmission.timestamp
          }
        }
      });

      return res.status(200).json(submittedFeedback);
    }
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ error: 'Error submitting feedback' });
  }
}
