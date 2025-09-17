import { createTransport } from 'nodemailer';
import { render } from '@react-email/render';
import { TestGroupInvitationEmail } from '@/emails/TestGroupInvitation';
import TestSessionStartEmail from '@/emails/TestSessionStartEmail';
import WeeklyDigestEmail from '@/emails/WeeklyDigestEmail';

const transportConfig = {
  host: process.env.EMAIL_HOST || process.env.EMAIL_SERVER_HOST || 'localhost',
  port: parseInt(process.env.EMAIL_PORT || process.env.EMAIL_SERVER_PORT || '587'),
  auth: {
    user: process.env.EMAIL_USER || process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: (process.env.EMAIL_SECURE || process.env.EMAIL_SERVER_SECURE) === 'true',
  debug: true,
  tls: {
    rejectUnauthorized:
      (process.env.EMAIL_REJECT_UNAUTHORIZED || 'false') !== 'false',
  },
};

console.log('Email Configuration (resolved):', transportConfig);

const transporter = createTransport(transportConfig);

// Verify the connection immediately
verifyEmailConfig().then(isValid => {
  if (!isValid) {
    console.error('Email configuration verification failed. Please check your SMTP settings.');
  } else {
    console.log('Email configuration verified successfully.');
  }
}).catch(error => {
  console.error('Email verification error:', error);
});

const FROM_ADDRESS = process.env.EMAIL_FROM || `"FeedbackFlow" <${transportConfig.auth.user}>`;

export async function sendTestGroupInvitation(
  to: string,
  invitationUrl: string,
  testGroupName: string,
  inviterName: string,
  testGroupDomain: string,
  role: string,
  expiresAt: Date
) {
  try {
    const html = await render(
      TestGroupInvitationEmail({
        inviteeEmail: to,
        invitationUrl,
        testGroupName,
        inviterName,
        testGroupDomain,
        role,
        expiresAt,
      })
    );

    const mailOptions = {
      from: FROM_ADDRESS,
      to,
      subject: `You've been invited to join ${testGroupName}`,
      html,
    };

    console.log('Sending email with options:', {
      ...mailOptions,
      html: '...',
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendTestSessionStart(
  to: string,
  testGroupName: string,
  sessionId: string,
  moderatorName: string
) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/test-groups/${testGroupName}/sessions/${sessionId}`;
  const html = await render(
    TestSessionStartEmail({
      testGroupName,
      sessionId,
      moderatorName,
      dashboardUrl,
    })
  );

  return transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: `New test session started in ${testGroupName}`,
    html,
  });
}

export async function sendWeeklyDigest(
  to: string,
  userName: string,
  testGroups: {
    groupName: string;
    memberCount: number;
    activeTestSessions: number;
    newFeedbackCount: number;
  }[],
  startDate: Date,
  endDate: Date
) {
  const html = await render(
    WeeklyDigestEmail({
      userName,
      testGroups,
      startDate,
      endDate,
    })
  );

  return transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: `Your Weekly Digest`,
    html,
  });
}

export async function sendTestGroupCreationConfirmation(
  to: string,
  testGroupName: string,
  testGroupId: string
) {
  const html = `
    <h1>Test Group Created Successfully!</h1>
    <p>Your test group "${testGroupName}" has been created.</p>
    <p>You can manage your test group here: <a href="${process.env.NEXTAUTH_URL}/test-groups/${testGroupId}/dashboard">View Dashboard</a></p>
    <p>Next steps:</p>
    <ul>
      <li>Invite team members</li>
      <li>Configure test group settings</li>
      <li>Start your first test session</li>
    </ul>
  `;

  return transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: `Test Group "${testGroupName}" Created Successfully`,
    html,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
  const html = `
    <h1>Password Reset Request</h1>
    <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>If you did not request this, you can ignore this email.</p>
  `;
  return transporter.sendMail({
    from: FROM_ADDRESS,
    to,
    subject: 'Password Reset Request',
    html,
  });
}

export async function verifyEmailConfig() {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
} 