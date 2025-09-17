import { prisma } from './prisma';

export interface WidgetContext {
  testGroupId: string;
  memberToken: string;
  domain: string;
}

export async function validateDomain(domain: string, testGroupId: string): Promise<boolean> {
  try {
    const testGroup = await prisma.testGroup.findUnique({
      where: { id: testGroupId },
      select: { domain: true, status: true }
    });

    if (!testGroup || testGroup.status !== 'ACTIVE') {
      return false;
    }

    if (!testGroup.domain) return false;
    
    // Normalize domains for comparison
    const normalizedTestDomain = new URL(testGroup.domain).hostname.toLowerCase();
    const normalizedRequestDomain = new URL(domain).hostname.toLowerCase();

    // Check if domains match (including subdomains)
    return normalizedRequestDomain === normalizedTestDomain ||
           normalizedRequestDomain.endsWith('.' + normalizedTestDomain);
  } catch (error) {
    console.error('Domain validation error:', error);
    return false;
  }
}

export async function generateWidgetContext(testGroupId: string, userId: string): Promise<WidgetContext | null> {
  try {
    // Verify test group membership
    const membership = await prisma.testGroupMember.findFirst({
      where: {
        testGroupId,
        userId,
      },
      include: {
        testGroup: {
          select: {
            domain: true,
            status: true
          }
        }
      }
    });

    if (!membership || membership.testGroup.status !== 'ACTIVE') {
      return null;
    }

    // Generate a secure member token for widget authentication
    const memberToken = await generateMemberToken(userId, testGroupId);

    return {
      testGroupId,
      memberToken,
      domain: membership.testGroup.domain || ''
    };
  } catch (error) {
    console.error('Widget context generation error:', error);
    return null;
  }
}

async function generateMemberToken(userId: string, testGroupId: string): Promise<string> {
  const { sign } = await import('jsonwebtoken');
  const secret = process.env.WIDGET_JWT_SECRET!;
  
  return sign(
    {
      userId,
      testGroupId,
      type: 'widget_auth',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    },
    secret
  );
} 