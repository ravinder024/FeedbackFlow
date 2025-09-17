import { TestGroup, User } from '@prisma/client';
import { sendTestSessionStart, sendWeeklyDigest } from './email';
import { prisma } from './prisma';

export interface NotificationContext {
  testGroup: TestGroup;
  actor?: User;
  recipient: User;
}

export class NotificationService {
  private static async shouldNotifyUser(userId: string, notificationType: keyof UserSettings): Promise<boolean> {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });
    return !!settings?.[notificationType];
  }

  static async notifyTestSessionStart(context: NotificationContext & { sessionId: string }) {
    const { testGroup, recipient, sessionId } = context;

    if (!(await this.shouldNotifyUser(recipient.id, 'notifyOnTestStart'))) {
      return;
    }

    await sendTestSessionStart(
      recipient.email!,
      testGroup.name,
      sessionId,
      context.actor?.name || 'Moderator'
    );
  }

  static async sendWeeklyDigest(
    recipient: User,
    testGroups: TestGroup[],
    startDate: Date,
    endDate: Date
    ) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: recipient.id },
    });

    if (!settings?.receiveWeeklyDigest) {
      return;
    }

    // Generate weekly statistics and activity summary
    const stats = await Promise.all(
      testGroups.map(async (group) => {
        const memberCount = await prisma.testGroupMember.count({
          where: { testGroupId: group.id },
        });

        // These counts would need to be calculated based on the date range
        const activeTestSessions = 0; 
        const newFeedbackCount = 0;

        return {
          groupName: group.name,
          memberCount,
          activeTestSessions,
          newFeedbackCount
        };
      })
    );

    await sendWeeklyDigest(
        recipient.email!,
        recipient.name || recipient.email!,
        stats,
        startDate,
        endDate
    );
  }

  // Add more notification methods as needed
} 