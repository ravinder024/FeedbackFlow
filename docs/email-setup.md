# Email Notification Setup

This document explains how to set up email notifications for FeedbackFlow.

## Environment Variables

Add the following variables to your `.env` file:

```env
# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-specific-password"
SMTP_FROM="FeedbackFlow <noreply@feedbackflow.com>"
SMTP_SECURE="false" # Set to true for port 465
```

## Gmail Setup Instructions

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to your Google Account settings
   - Navigate to Security
   - Under "2-Step Verification", click on "App passwords"
   - Select "Mail" and your device
   - Click "Generate"
   - Use the generated password as your `SMTP_PASSWORD`

## Testing Email Configuration

You can test your email configuration by running:

```typescript
import { verifyEmailConfig } from '@/lib/email';

// In an async context
const isValid = await verifyEmailConfig();
if (isValid) {
  console.log('Email configuration is working!');
} else {
  console.log('Email configuration is invalid');
}
```

## Email Templates

The application uses React Email for creating beautiful, responsive email templates. Current templates include:

1. Test Group Invitation (`src/emails/TestGroupInvitation.tsx`)
   - Sent when a user is invited to join a test group
   - Includes group details and invitation link
   - Expires after 7 days

## Troubleshooting

Common issues and solutions:

1. **Authentication Failed**
   - Check if your email and password are correct
   - For Gmail, make sure you're using an App Password, not your regular password
   - Verify that 2-Step Verification is enabled

2. **Connection Timeout**
   - Check if the SMTP host is correct
   - Verify that the port is not blocked by your firewall
   - Try switching between secure (465) and non-secure (587) ports

3. **Invalid Sender**
   - Ensure the `SMTP_FROM` address matches your email provider's requirements
   - For Gmail, the sender email should match your `SMTP_USER`

## Security Considerations

1. Never commit your SMTP credentials to version control
2. Use environment variables for all sensitive information
3. Consider using email service providers (SendGrid, Amazon SES) for production
4. Implement rate limiting for invitation emails
5. Monitor failed email attempts for potential abuse

## Future Improvements

1. Add email queue system for better reliability
2. Implement email templates for more notifications:
   - Test group updates
   - Feedback notifications
   - Weekly summaries
3. Add email preference management for users
4. Implement email tracking and analytics 