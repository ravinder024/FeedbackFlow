import { sendTestGroupInvitation } from '../email';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('Email Utility Tests', () => {
  const mockSendMail = jest.fn();

  beforeAll(() => {
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send a test group invitation email', async () => {
    const to = 'test@example.com';
    const invitationUrl = 'http://example.com/invite';
    const testGroupName = 'Test Group';
    const inviterName = 'Admin';
    const testGroupDomain = 'example.com';
    const role = 'MEMBER';
    const expiresAt = new Date();

    await sendTestGroupInvitation(
      to,
      invitationUrl,
      testGroupName,
      inviterName,
      testGroupDomain,
      role,
      expiresAt
    );

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to,
        subject: `You've been invited to join ${testGroupName}`,
        html: expect.stringContaining(invitationUrl),
      })
    );
  });

  it('should throw an error if email sending fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP Error'));

    await expect(
      sendTestGroupInvitation(
        'test@example.com',
        'http://example.com/invite',
        'Test Group',
        'Admin',
        'example.com',
        'MEMBER',
        new Date()
      )
    ).rejects.toThrow('SMTP Error');
  });
});