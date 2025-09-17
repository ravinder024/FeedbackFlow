import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailTemplateProps {
  previewText: string;
  children: React.ReactNode;
  footerText?: string;
}

export default function BaseEmailTemplate({
  previewText,
  children,
  footerText: customFooterText,
}: BaseEmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <img
              src="https://your-domain.com/logo.png"
              alt="FeedbackFlow"
              width="150"
              height="40"
            />
          </Section>

          {/* Content */}
          <Section style={content}>
            {children}
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerTextStyle}>
              {customFooterText || 'This email was sent from FeedbackFlow. If you did not expect this email, you can ignore it or contact support.'}
            </Text>
            <Text style={footerLinks}>
              <Link href="https://your-domain.com/settings">Email Preferences</Link>
              {' • '}
              <Link href="https://your-domain.com/support">Support</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const header = {
  padding: '24px',
  borderBottom: '1px solid #e6ebf1',
  textAlign: 'center' as const,
};

const content = {
  padding: '24px',
};

const footer = {
  padding: '0 24px',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footerTextStyle = {
  fontSize: '12px',
  color: '#6b7280',
  textAlign: 'center' as const,
};

const footerLinks = {
  fontSize: '12px',
  color: '#6b7280',
  textAlign: 'center' as const,
}; 