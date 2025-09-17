import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/roles';
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export async function withAuth(
  req: NextRequest,
  allowedRoles: UserRole[] = []
) {
  try {
    const token = await getToken({ req });

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // If no specific roles are required, just check for authentication
    if (allowedRoles.length === 0) {
      return NextResponse.next();
    }

    // Check if user has required role
    const userRole = token.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
}

// Helper function to check if user has required role
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (userRole === UserRole.ADMIN) return true; // Admin has access to everything
  return requiredRoles.includes(userRole);
}

// Middleware configuration for different routes
export const config = {
  matcher: [
    '/api/test-groups/:path*',
    '/api/invitations/:path*',
    '/dashboard/:path*',
    '/test-groups/:path*',
  ],
}; 