import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';

interface TestGroupInvitationEmailProps {
  inviteeEmail: string;
  testGroupName: string;
  testGroupDomain: string;
  role: string;
  invitationUrl: string;
  expiresAt: Date;
  inviterName: string;
}

export function TestGroupInvitationEmail({
  inviteeEmail,
  testGroupName,
  testGroupDomain,
  role,
  invitationUrl,
  expiresAt,
  inviterName,
}: TestGroupInvitationEmailProps) {
  const previewText = `You've been invited to join ${testGroupName} as a ${role.toLowerCase().replace('_', ' ')}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Test Group Invitation</Heading>
          
          <Text style={text}>
            Hello {inviteeEmail},
          </Text>
          
          <Text style={text}>
            You've been invited to join <strong>{testGroupName}</strong> as a{' '}
            <strong>{role.toLowerCase().replace('_', ' ')}</strong>.
          </Text>

          <Text style={text}>
            Invited by {inviterName}
          </Text>

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={invitationUrl}
            >
              Accept Invitation
            </Button>
          </Section>

          <Text style={text}>
            This test group is associated with the domain: <strong>{testGroupDomain}</strong>
          </Text>

          <Text style={text}>
            This invitation will expire on {expiresAt.toLocaleDateString()}.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            If you don't want to accept this invitation, you can ignore this email. If you didn't
            expect to receive an invitation to join this test group, you can{' '}
            <Link href="mailto:support@feedbackflow.com">report this invite</Link>.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
};

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const buttonContainer = {
  margin: '24px 0',
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 20px',
};

const hr = {
  borderColor: '#ddd',
  margin: '32px 0',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
};

export function renderTestGroupInvitationEmail(props: TestGroupInvitationEmailProps) {
  return render(<TestGroupInvitationEmail {...props} />);
} 