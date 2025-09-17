import { TestGroupRole } from './roles';

export interface TestGroupMember {
  id: string;
  userId: string;
  role: TestGroupRole;
  joinedAt: Date;
}

export interface TestGroupFeedback {
  id: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export interface TestGroupModerator {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface TestGroupResponse {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  createdAt: Date;
  moderator: TestGroupModerator | null;
  members: TestGroupMember[];
  feedback: TestGroupFeedback[];
  _count: {
    members: number;
    sessions: number;
  };
}
