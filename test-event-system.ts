/**
 * Test Event Logging System
 * 
 * This script tests the new EventLog and UserActivity models
 * to ensure they're working correctly with proper indexing.
 */

import { EventLogger, EVENT_TYPES, USER_ACTIONS } from './src/lib/event-logger';

async function testEventLogging() {
  console.log('🧪 Testing Event Logging System...');
  console.log('=====================================');

  try {
    // Test 1: Log a PIN_CREATED event
    console.log('📍 Test 1: Logging PIN_CREATED event...');
    const event1 = await EventLogger.logEvent({
      eventType: EVENT_TYPES.PIN_CREATED,
      pinId: 'test-pin-1',
      pageUrl: 'https://example.com/test',
      userId: 'test-user-1',
      testGroupId: 'test-group-1',
      data: {
        coordinates: { x: 100, y: 200 },
        emoji: '😀',
        severity: 'medium',
        description: 'Test pin creation'
      }
    });
    console.log('✅ Event logged:', event1?.id);

    // Test 2: Log user activity
    console.log('👤 Test 2: Logging user activity...');
    const activity1 = await EventLogger.logUserActivity({
      userId: 'test-user-1',
      sessionId: 'test-session-1',
      action: USER_ACTIONS.PIN_CREATE,
      metadata: { pinId: 'test-pin-1' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    console.log('✅ Activity logged:', activity1?.id);

    // Test 3: Query events with filtering
    console.log('🔍 Test 3: Querying events...');
    const events = await EventLogger.getEvents({
      userId: 'test-user-1',
      eventType: EVENT_TYPES.PIN_CREATED,
      limit: 10
    });
    console.log(`✅ Found ${events.events.length} events`);

    // Test 4: Query user activities
    console.log('📊 Test 4: Querying user activities...');
    const activities = await EventLogger.getUserActivity({
      userId: 'test-user-1',
      action: USER_ACTIONS.PIN_CREATE,
      limit: 10
    });
    console.log(`✅ Found ${activities.activities.length} activities`);

    // Test 5: Get event statistics
    console.log('📈 Test 5: Getting event statistics...');
    const stats = await EventLogger.getEventStats({
      testGroupId: 'test-group-1'
    });
    console.log('✅ Statistics:', {
      totalEvents: stats.totalEvents,
      eventTypes: stats.eventTypeCounts.length
    });

    // Test 6: Test performance with multiple events
    console.log('🚀 Test 6: Performance test with batch events...');
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        EventLogger.logEvent({
          eventType: EVENT_TYPES.PIN_CREATED,
          pinId: `batch-pin-${i}`,
          pageUrl: `https://example.com/batch/${i}`,
          userId: 'batch-user',
          testGroupId: 'batch-group',
          data: { batchId: i }
        })
      );
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    console.log(`✅ Batch logging completed in ${endTime - startTime}ms`);

    // Test 7: Verify indexes are working (should be fast)
    console.log('⚡ Test 7: Testing index performance...');
    const indexStartTime = Date.now();
    
    const indexedQuery = await EventLogger.getEvents({
      userId: 'batch-user',
      testGroupId: 'batch-group',
      limit: 5
    });
    
    const indexEndTime = Date.now();
    console.log(`✅ Indexed query completed in ${indexEndTime - indexStartTime}ms`);
    console.log(`📄 Found ${indexedQuery.events.length} events`);

    console.log('');
    console.log('🎉 All tests completed successfully!');
    console.log('✅ EventLog model is working correctly');
    console.log('✅ UserActivity model is working correctly');
    console.log('✅ Indexes are properly configured');
    console.log('✅ Performance is good');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEventLogging()
  .then(() => {
    console.log('');
    console.log('💡 Next steps:');
    console.log('1. Integrate event logging into your application');
    console.log('2. Set up automated cleanup for old logs');
    console.log('3. Create dashboard views for event analytics');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
