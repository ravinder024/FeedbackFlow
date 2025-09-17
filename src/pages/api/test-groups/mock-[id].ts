import { NextApiRequest, NextApiResponse } from 'next';
import { mockTestGroups } from './mock-data';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid test group ID' });
  }

  switch (req.method) {
    case 'GET':
      // Try to find test group by ID in mock data, or generate one if not found
      let testGroup = mockTestGroups.find(group => group.id === id);
      
      if (!testGroup) {
        // Generate a simple mock response for any test group ID
        const mockResponse = {
          id: id,
          name: `Test Group (Mock ${id.slice(-8)})`, // Use last 8 chars for readability
          description: 'This is mock test group data for development',
          domain: 'saucedemo.com',
          memberCount: 5,
          activeMembers: 4,
          // Dashboard-specific fields
          feedback: 12, // Renamed from totalFeedback for dashboard compatibility
          resolvedPins: 5,
          activePins: 7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          moderator: {
            id: 'mock-moderator-id',
            name: 'Mock Moderator',
            email: 'moderator@example.com',
            image: null,
          },
          _count: {
            members: 5,
            widgetFeedback: 12,
            sessions: 3,
          },
          members: [
            {
              id: 'mock-member-1',
              role: 'TEST_MEMBER',
              joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                id: 'mock-user-1',
                name: 'John Doe',
                email: 'john@example.com',
                image: null,
              },
            },
          ],
          recentActivity: 8,
          pendingInvitations: 2,
        };
        
        return res.status(200).json(mockResponse);
      }
      
      // Transform the existing mock data to match the expected dashboard format
      const transformedData = {
        id: testGroup.id,
        name: testGroup.name,
        description: testGroup.description || '',
        domain: testGroup.domain || 'example.com',
        memberCount: testGroup.members.length,
        activeMembers: testGroup.members.filter(m => m.user.role !== 'INACTIVE').length,
        totalFeedback: 12, // Mock feedback count
        resolvedPins: 4,   // Mock resolved pins count
        createdAt: testGroup.createdAt,
        userRole: 'MODERATOR' // Mock user role
      };
      
      console.log(`API: Returning transformed test group ${id}:`, transformedData);
      return res.status(200).json(transformedData);
      
    case 'PUT':
      // Update test group
      const groupIndex = mockTestGroups.findIndex(group => group.id === id);
      
      if (groupIndex === -1) {
        return res.status(404).json({ error: 'Test group not found' });
      }
      
      const updatedGroup = { ...mockTestGroups[groupIndex], ...req.body };
      mockTestGroups[groupIndex] = updatedGroup;
      
      console.log(`API: Updated test group ${id}`);
      return res.status(200).json(updatedGroup);
      
    case 'DELETE':
      // Delete test group
      const deleteIndex = mockTestGroups.findIndex(group => group.id === id);
      
      if (deleteIndex === -1) {
        return res.status(404).json({ error: 'Test group not found' });
      }
      
      mockTestGroups.splice(deleteIndex, 1);
      console.log(`API: Deleted test group ${id}`);
      return res.status(200).json({ success: true, message: 'Test group deleted' });
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
