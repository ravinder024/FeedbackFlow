import { prisma } from './src/lib/prisma';

// Test if models are available
async function testModels() {
  console.log('Available Prisma models:');
  console.log('EventLog:', typeof prisma.eventLog);
  console.log('UserActivity:', typeof prisma.userActivity);
  
  // Try to create a test event
  try {
    const event = await prisma.eventLog.create({
      data: {
        eventType: 'TEST_EVENT',
        data: { test: true }
      }
    });
    console.log('EventLog created:', event.id);
    
    // Clean up
    await prisma.eventLog.delete({ where: { id: event.id } });
  } catch (error) {
    console.error('EventLog test failed:', error);
  }
  
  // Try to create a test user activity
  try {
    const activity = await prisma.userActivity.create({
      data: {
        userId: 'test-user',
        sessionId: 'test-session',
        action: 'TEST_ACTION'
      }
    });
    console.log('UserActivity created:', activity.id);
    
    // Clean up
    await prisma.userActivity.delete({ where: { id: activity.id } });
  } catch (error) {
    console.error('UserActivity test failed:', error);
  }
}

testModels();
