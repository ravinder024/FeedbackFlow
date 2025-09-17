import { PrismaClient } from '@prisma/client';
import { Role, MemberRole } from '@prisma/client';
import { getSession } from 'next-auth/react';
import { prisma } from './prisma';

const prismaClient = new PrismaClient();

export interface AccessControl {
  canViewTestGroup: (userId: string, testGroupId: string) => Promise<boolean>;
  canModerateTestGroup: (userId: string, testGroupId: string) => Promise<boolean>;
  canViewFeedback: (userId: string, feedbackId: string) => Promise<boolean>;
  canModerateFeedback: (userId: string, feedbackId: string) => Promise<boolean>;
}

export const getRoleBasedAccess = async (userId: string): Promise<{
  testGroups: string[];
  moderatedGroups: string[];
  isAdmin: boolean;
}> => {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    include: {
      testGroupMemberships: true,
      moderatedGroups: true,
    },
  });

  if (!user) throw new Error('User not found');

  return {
    testGroups: user.testGroupMemberships.map(m => m.testGroupId),
    moderatedGroups: user.moderatedGroups.map(g => g.id),
    isAdmin: user.role === UserRole.ADMIN,
  };
};

export const getTestGroupAccess = async (userId: string, testGroupId: string) => {
  const membership = await prismaClient.testGroupMember.findUnique({
    where: {
      AND: [
        { userId },
        { testGroupId }
      ],
    },
  });

  const user = await prismaClient.user.findUnique({
    where: { id: userId },
  });

  return {
    isMember: !!membership,
    isModerator: membership?.role === TestGroupRole.MODERATOR,
    isAdmin: user?.role === UserRole.ADMIN,
  };
};

export const getFeedbackAccess = async (userId: string, feedbackId: string) => {
  const feedback = await prismaClient.testFeedback.findUnique({
    where: { id: feedbackId },
    include: {
      session: {
        include: {
          testGroup: true,
        },
      },
    },
  });

  if (!feedback) throw new Error('Feedback not found');

  const access = await getTestGroupAccess(userId, feedback.session.testGroupId);
  
  return {
    ...access,
    isAuthor: feedback.userId === userId,
  };
};

// Audit logging removed as we don't have a dedicated audit log table
// We can add this back later if needed

export const getTestGroupAnalytics = async (testGroupId: string, userId: string) => {
  const access = await getTestGroupAccess(userId, testGroupId);
  
  if (!access.isModerator && !access.isAdmin) {
    throw new Error('Unauthorized access to analytics');
  }

  return prismaClient.testSession.findMany({
    where: {
      testGroupId,
    },
    include: {
      feedback: {
        select: {
          id: true,
          qualityScore: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          feedback: true,
        },
      },
    },
  });
};

export const getTestMemberAnalytics = async (testGroupId: string, userId: string) => {
  const access = await getTestGroupAccess(userId, testGroupId);
  
  if (!access.isMember && !access.isModerator && !access.isAdmin) {
    throw new Error('Unauthorized access');
  }

  return prismaClient.testSession.findMany({
    where: {
      testGroupId,
      feedback: {
        some: {
          userId,
        },
      },
    },
    include: {
      feedback: {
        where: {
          userId,
        },
        select: {
          id: true,
          qualityScore: true,
          createdAt: true,
        },
      },
    },
  });
};