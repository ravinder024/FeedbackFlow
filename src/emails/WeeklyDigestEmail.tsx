import {
  Heading,
  Text,
  Section,
} from '@react-email/components';
import BaseEmailTemplate from './components/BaseEmailTemplate';

interface TestGroupStats {
  groupName: string;
  memberCount: number;
  activeTestSessions: number;
  newFeedbackCount: number;
}

interface WeeklyDigestEmailProps {
  userName: string;
  testGroups: TestGroupStats[];
  startDate: Date;
  endDate: Date;
}

export default function WeeklyDigestEmail({
  userName,
  testGroups,
  startDate,
  endDate,
}: WeeklyDigestEmailProps) {
  const previewText = `Your weekly test groups digest (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;

  return (
    <BaseEmailTemplate previewText={previewText}>
      <Heading style={heading}>
        Your Weekly Test Groups Digest
      </Heading>

      <Text style={text}>
        Hello {userName},
      </Text>

      <Text style={text}>
        Here's your weekly summary of test group activities from {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}.
      </Text>

      {testGroups.map((group) => (
        <Section key={group.groupName} style={groupSection}>
          <Heading as="h2" style={subheading}>
            {group.groupName}
          </Heading>
          
          <div style={statsGrid}>
            <div style={statItem}>
              <Text style={statLabel}>Members</Text>
              <Text style={statValue}>{group.memberCount}</Text>
            </div>
            
            <div style={statItem}>
              <Text style={statLabel}>Active Tests</Text>
              <Text style={statValue}>{group.activeTestSessions}</Text>
            </div>
            
            <div style={statItem}>
              <Text style={statLabel}>New Feedback</Text>
              <Text style={statValue}>{group.newFeedbackCount}</Text>
            </div>
          </div>
        </Section>
      ))}

      <Text style={text}>
        Visit your dashboard to view detailed statistics and manage your test groups.
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

const subheading = {
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.3',
  color: '#1f2937',
  margin: '0 0 16px',
};

const groupSection = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '16px',
  margin: '16px 0',
};

const statItem = {
  textAlign: 'center' as const,
  padding: '12px',
  backgroundColor: '#ffffff',
  borderRadius: '6px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

const statLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 4px',
};

const statValue = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#2563eb',
  margin: '0',
}; 