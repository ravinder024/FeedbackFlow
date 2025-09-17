import {
  Heading,
  Text,
  Section,
} from '@react-email/components';
import BaseEmailTemplate from './components/BaseEmailTemplate';

interface TestSessionStartEmailProps {
  testGroupName: string;
  sessionId: string;
  moderatorName: string;
  dashboardUrl: string;
}

export default function TestSessionStartEmail({
  testGroupName,
  sessionId,
  moderatorName,
  dashboardUrl,
}: TestSessionStartEmailProps) {
  const previewText = `A new test session has started in ${testGroupName}`;

  return (
    <BaseEmailTemplate previewText={previewText}>
      <Heading style={heading}>
        New Test Session Started
      </Heading>

      <Text style={text}>
        Hello,
      </Text>

      <Text style={text}>
        A new test session has been started in <strong>{testGroupName}</strong> by {moderatorName}.
      </Text>

      <Section style={detailsSection}>
        <Text style={detailsText}>
          <strong>Session ID:</strong> {sessionId}
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <a href={dashboardUrl} style={button}>
          View Test Session
        </a>
      </Section>

      <Text style={text}>
        You are receiving this email because you are a member of the test group and have enabled test session notifications.
      </Text>
    </BaseEmailTemplate>
  );
}

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  color: '#1f2937',
  margin: '16px 0',
};

const text = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '12px 0',
};

const detailsSection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
};

const detailsText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#4b5563',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
}; 