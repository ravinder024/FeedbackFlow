import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Role } from '@prisma/client';

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

// Role-based access control middleware
export function withRoleCheck(handler: NextApiHandler, allowedRoles: Role[]): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = session.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }

    return handler(req, res);
  };
}

// Allow all authenticated users
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    return handler(req, res);
  };
}

// Only allow admins
export function withAdminOnly(handler: NextApiHandler): NextApiHandler {
  return withRoleCheck(handler, [Role.ADMIN]);
}

// Allow admins and moderators
export function withModeratorOrAdmin(handler: NextApiHandler): NextApiHandler {
  return withRoleCheck(handler, [Role.ADMIN, Role.MODERATOR]);
}

// Allow any authenticated role (admin, moderator, or test member)
export function withAnyRole(handler: NextApiHandler): NextApiHandler {
  return withRoleCheck(handler, [Role.ADMIN, Role.MODERATOR, Role.TEST_MEMBER]);
}

// Allow test members only
export function withTestMemberOnly(handler: NextApiHandler): NextApiHandler {
  return withRoleCheck(handler, [Role.TEST_MEMBER]);
} 