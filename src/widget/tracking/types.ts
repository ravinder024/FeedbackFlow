export type BehaviorEventType =
  | 'click'
  | 'rage_click'
  | 'dead_click'
  | 'navigation'
  | 'page_exit';

export interface BehaviorEvent {
  type: BehaviorEventType;
  element: string;
  page: string;
  timestamp: number;
  session_id: string;
}

export interface TrackerConfig {
  endpoint: string;
  testGroupId?: string;
  sessionId: string;
  batchSize?: number;
  flushIntervalMs?: number;
}
