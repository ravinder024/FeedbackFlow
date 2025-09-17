// Test script to populate the activity dashboard with sample data
const baseUrl = 'http://localhost:3000';

async function createSampleData() {
  console.log('Creating sample event data...');

  // Sample pin events
  const pinEvents = [
    {
      eventType: 'PIN_CREATED',
      pinId: 'test-pin-1',
      data: {
        pageUrl: '/dashboard',
        x: 100,
        y: 200,
        testGroupId: 'default-group',
        emoji: '😀',
        severity: 'low',
        comment: 'This button is confusing'
      }
    },
    {
      eventType: 'PIN_CREATED',
      pinId: 'test-pin-2',
      data: {
        pageUrl: '/feedback',
        x: 300,
        y: 150,
        testGroupId: 'default-group',
        emoji: '😢',
        severity: 'high',
        comment: 'Page loads too slowly'
      }
    },
    {
      eventType: 'COMMENT_ADDED',
      pinId: 'test-pin-1',
      data: {
        pageUrl: '/dashboard',
        comment: 'I agree, this needs clarification',
        testGroupId: 'default-group'
      }
    },
    {
      eventType: 'PIN_UPDATED',
      pinId: 'test-pin-2',
      data: {
        pageUrl: '/feedback',
        x: 300,
        y: 150,
        testGroupId: 'default-group',
        emoji: '😡',
        severity: 'critical',
        comment: 'Page loads too slowly - this is blocking work'
      }
    }
  ];

  // Sample user activities
  const userActivities = [
    {
      type: 'activity',
      data: {
        userId: 'test-user-1',
        sessionId: 'sess_test_123',
        action: 'HOME_VISIT',
        metadata: {
          path: '/',
          method: 'GET',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referer: null
        },
        ipAddress: '192.168.1.XXX',
        userAgent: 'Mozilla/5.0 (Test Browser)'
      }
    },
    {
      type: 'activity',
      data: {
        userId: 'test-user-1',
        sessionId: 'sess_test_123',
        action: 'DASHBOARD_VISIT',
        metadata: {
          path: '/dashboard',
          method: 'GET',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          referer: 'http://localhost:3000/'
        },
        ipAddress: '192.168.1.XXX',
        userAgent: 'Mozilla/5.0 (Test Browser)'
      }
    },
    {
      type: 'activity',
      data: {
        userId: 'anonymous',
        sessionId: 'sess_anon_456',
        action: 'FEEDBACK_VISIT',
        metadata: {
          path: '/feedback',
          method: 'GET',
          userAgent: 'Mozilla/5.0 (Chrome)',
          referer: null
        },
        ipAddress: '10.0.0.XXX',
        userAgent: 'Mozilla/5.0 (Chrome)'
      }
    }
  ];

  try {
    // Create pin events
    for (const event of pinEvents) {
      const response = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        console.log(`✅ Created ${event.eventType} for pin ${event.pinId}`);
      } else {
        console.log(`❌ Failed to create ${event.eventType}:`, await response.text());
      }
    }

    // Create user activities
    for (const activity of userActivities) {
      const response = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity)
      });
      
      if (response.ok) {
        console.log(`✅ Created activity: ${activity.data.action}`);
      } else {
        console.log(`❌ Failed to create activity:`, await response.text());
      }
    }

    console.log('\n🎉 Sample data creation complete!');
    console.log('Visit http://localhost:3000/dashboard/activity to view the dashboard');

  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Run the script
createSampleData();
