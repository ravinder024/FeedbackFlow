export type PinStatus = 'new' | 'inProgress' | 'resolved';
export type Severity = 'Low' | 'Medium' | 'High';

export interface Coordinates {
  xPercent: number;
  yPercent: number;
}

export interface Pin {
  id: string;
  pageUrl: string;
  xPercent: number;    // 0-100
  yPercent: number;    // 0-100
  status: PinStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PinCreationData {
  pageUrl: string;
  xPercent: number;
  yPercent: number;
}

export interface PinUpdateData {
  status?: PinStatus;
}

export interface TestSessionContext {
  id: string;
  testGroupId: string;
  isActive: boolean;
  role?: 'moderator' | 'member';
}

export interface FeedbackWidgetProps {
  testSession?: TestSessionContext | null;
  onFeedbackSubmit?: (feedback: {
    content: string;
    rating: number | null;
    emotion: string;
    metadata: {
      xPercent: number;
      yPercent: number;
      pageUrl: string;
    };
    testSessionId: string;
  }) => Promise<void>;
  url?: string;
  targetUrl?: string;
  mode?: 'session' | 'collect';
  onClose?: () => void;
}