import { BehaviorEvent, TrackerConfig } from './types';

const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL_MS = 3000;

export class EventTransport {
  private readonly endpoint: string;
  private readonly testGroupId?: string;
  private readonly batchSize: number;
  private readonly flushIntervalMs: number;
  private queue: BehaviorEvent[] = [];
  private timer: number | null = null;

  constructor(config: TrackerConfig) {
    this.endpoint = config.endpoint;
    this.testGroupId = config.testGroupId;
    this.batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;
    this.flushIntervalMs = config.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;
  }

  start(): void {
    if (this.timer !== null) {
      return;
    }

    this.timer = window.setInterval(() => {
      this.flush('interval');
    }, this.flushIntervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }

    this.flush('stop');
  }

  enqueue(event: BehaviorEvent): void {
    this.queue.push(event);

    if (this.queue.length >= this.batchSize) {
      this.flush('batch_full');
    }
  }

  flush(reason: string): void {
    if (this.queue.length === 0) {
      return;
    }

    const events = this.queue.splice(0, this.queue.length);
    const payload = {
      events,
      reason,
      testGroupId: this.testGroupId,
    };

    void fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Drop on failure for now to keep tracker lightweight.
    });
  }

  flushSync(reason: string): void {
    if (this.queue.length === 0) {
      return;
    }

    const events = this.queue.splice(0, this.queue.length);
    const payload = JSON.stringify({
      events,
      reason,
      testGroupId: this.testGroupId,
    });

    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      const ok = navigator.sendBeacon(this.endpoint, blob);
      if (ok) {
        return;
      }
    }

    void fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Ignore errors during unload path.
    });
  }
}
