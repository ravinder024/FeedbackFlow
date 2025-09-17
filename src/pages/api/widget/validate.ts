import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers to allow requests from any domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testGroupId, domain } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!testGroupId || !domain) {
      return res.status(400).json({ error: 'Test group ID and domain are required' });
    }
    
    // Verify the token
    const secret = process.env.JWT_SECRET || 'feedbackflow-widget-secret-key';
    
    let tokenData;
    try {
      tokenData = jwt.verify(token, secret) as { userId: string; testGroupId: string; domain: string; };
    } catch (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Ensure token belongs to this test group
    if (tokenData.testGroupId !== testGroupId) {
      return res.status(403).json({ error: 'Token not valid for this test group' });
    }
    
    // Get the test group
    const testGroup = await prisma.testGroup.findUnique({
      where: { id: testGroupId },
    });
    
    if (!testGroup) {
      return res.status(404).json({ error: 'Test group not found' });
    }
    
    // Validate that the domain matches or is a subdomain
    const requestDomain = domain.toLowerCase();
    const testGroupDomain = testGroup.domain.toLowerCase();
    
    // Allow exact match or subdomains
    const isValidDomain = requestDomain === testGroupDomain || 
                         requestDomain.endsWith('.' + testGroupDomain);
    
    if (!isValidDomain) {
      return res.status(403).json({ 
        error: 'Domain not authorized for this test group',
        requestDomain,
        testGroupDomain,
      });
    }
    
    // Find an active session for this user and test group
    const userId = tokenData.userId;
    const activeSession = await prisma.testSession.findFirst({
      where: {
        testGroupId,
        startedById: userId,
        status: 'ACTIVE',
        endedAt: null,
      },
    });
    
    if (!activeSession) {
      return res.status(403).json({ error: 'No active testing session found' });
    }
    
    // Domain is valid, return success
    return res.status(200).json({ 
      valid: true, 
      domain: testGroup.domain,
      sessionId: activeSession.id,
      message: 'Domain validated successfully' 
    });
    
  } catch (error) {
    console.error('Error validating domain:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 