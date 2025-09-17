// Shared in-memory mock data for test-groups APIs (development only)

export interface MockInvite {
  id: string;
  testGroupId: string;
  email: string;
  status: string;
  createdAt: string;
  token: string;
  expiresAt?: string;
}

export interface MockUser {
  id: string;
  name?: string | null;
  email: string;
  role?: string;
  image?: string | null;
}

export interface MockMember {
  id: string;
  userId: string;
  testGroupId: string;
  role: string;
  joinedAt: string;
  user: MockUser;
}

export interface MockTestGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  status: string;
  moderatorId?: string;
  domain?: string | null;
  members: MockMember[];
  pendingInvitations: MockInvite[];
  sessions: any[];
}

export const mockInviteAttempts: MockInvite[] = [];

export const mockTestGroups: MockTestGroup[] = [
  {
    id: 'test-group-saucedemo',
    name: 'SauceDemo Test Group',
    description: 'Testing group for SauceDemo.com automation',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    moderatorId: 'mock-user-1',
    domain: 'saucedemo.com',
    members: [
      {
        id: 'member-1',
        userId: 'mock-user-1',
        testGroupId: 'test-group-saucedemo',
        role: 'MODERATOR',
        joinedAt: new Date().toISOString(),
        user: {
          id: 'mock-user-1',
          name: 'Dev Moderator',
          email: 'moderator@example.com',
          role: 'ADMIN',
        },
      },
    ],
    pendingInvitations: [],
    sessions: [],
  },
  {
    id: 'test-group-httpbin',
    name: 'HTTPBin Test Group',
    description: 'Testing group for HTTPBin API',
    createdAt: new Date().toISOString(),
    status: 'ACTIVE',
    moderatorId: 'mock-user-1',
    domain: 'httpbin.org',
    members: [],
    pendingInvitations: [],
    sessions: [],
  },
];
