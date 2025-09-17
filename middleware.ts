import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Helper function to anonymize IP addresses
export function anonymizeIP(ip: string | undefined): string {
  if (!ip) return 'unknown';
  
  // Handle IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.XXX`;
    }
  }
  
  // Handle IPv6 - anonymize last 64 bits
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}:XXXX:XXXX:XXXX:XXXX`;
    }
  }
  
  return 'unknown';
}

// Generate or get session ID from cookies
function getOrCreateSessionId(request: NextRequest): string {
  const existingSessionId = request.cookies.get('sessionId')?.value;
  if (existingSessionId) {
    return existingSessionId;
  }
  
  // Generate new session ID
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if path should be tracked
export function shouldTrackPath(pathname: string): boolean {
  // Skip API routes, static files, and internal Next.js routes
  const skipPatterns = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/.well-known/',
    '/health',
    '/status'
  ];
  
  return !skipPatterns.some(pattern => pathname.startsWith(pattern));
}

// Get action type based on pathname
export function getActionFromPath(pathname: string): string {
  if (pathname === '/') return 'HOME_VISIT';
  if (pathname.startsWith('/dashboard')) return 'DASHBOARD_VISIT';
  if (pathname.startsWith('/feedback')) return 'FEEDBACK_VISIT';
  if (pathname.startsWith('/test-groups')) return 'TEST_GROUP_VISIT';
  if (pathname.startsWith('/admin')) return 'ADMIN_VISIT';
  if (pathname.startsWith('/auth')) return 'AUTH_VISIT';
  return 'PAGE_VISIT';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip tracking for certain paths
  if (!shouldTrackPath(pathname)) {
    return NextResponse.next();
  }

  try {
    // Get session token (this doesn't require a database call)
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Get or create session ID
    const sessionId = getOrCreateSessionId(request);
    
    // Get client IP with proper handling of proxies
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : 
                     realIp || 
                     '127.0.0.1';

    // Anonymize IP address
    const anonymizedIp = anonymizeIP(clientIp);

    // Prepare activity data
    const activityData = {
      userId: token?.sub || 'anonymous',
      sessionId,
      action: getActionFromPath(pathname),
      metadata: {
        path: pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent') || 'unknown',
        referer: request.headers.get('referer') || null,
        timestamp: new Date().toISOString()
      },
      ipAddress: anonymizedIp,
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Log activity asynchronously to avoid blocking the request
    // We'll use the event logging API to handle this
    if (typeof window === 'undefined') {
      // Server-side: Make internal API call
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
      // Don't await this - fire and forget to avoid blocking
      fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NextJS-Middleware/1.0'
        },
        body: JSON.stringify({
          type: 'activity',
          data: activityData
        })
      }).catch(error => {
        // Silent fail - we don't want to break the request if logging fails
        console.error('Failed to log user activity:', error);
      });
    }

    // Create response
    const response = NextResponse.next();

    // Set session ID cookie if it didn't exist
    if (!request.cookies.get('sessionId')?.value) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
    }

    // Add some security headers while we're here
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    // Always continue the request even if logging fails
    return NextResponse.next();
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
