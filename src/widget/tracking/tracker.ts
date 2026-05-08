import { getStableSelector } from './selector';
import { EventTransport } from './transport';
import { BehaviorEvent, BehaviorEventType, TrackerConfig } from './types';

const RAGE_WINDOW_MS = 1200;
const RAGE_CLICK_THRESHOLD = 3;
const DEAD_CLICK_DELAY_MS = 700;
const RAGE_COOLDOWN_MS = 2000;

export interface BehaviorTracker {
  start: () => void;
  stop: () => void;
}

export function createBehaviorTracker(config: TrackerConfig): BehaviorTracker {
  const transport = new EventTransport(config);
  const clickHistory = new Map<string, number[]>();
  const rageCooldown = new Map<string, number>();

  let started = false;
  let mutationVersion = 0;
  let observer: MutationObserver | null = null;
  let originalPushState: History['pushState'] | null = null;
  let originalReplaceState: History['replaceState'] | null = null;
  const popstateHandler = () => handleNavigation('popstate');
  const hashchangeHandler = () => handleNavigation('hashchange');

  const currentPage = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;

  const emit = (type: BehaviorEventType, element: string, page: string, timestamp: number) => {
    const event: BehaviorEvent = {
      type,
      element,
      page,
      timestamp,
      session_id: config.sessionId,
    };

    transport.enqueue(event);
  };

  const handleNavigation = (source: string) => {
    emit('navigation', source, currentPage(), Date.now());
  };

  const handleRageClick = (selector: string, page: string, timestamp: number) => {
    const key = `${page}::${selector}`;
    const cooldownUntil = rageCooldown.get(key) || 0;

    if (timestamp < cooldownUntil) {
      return;
    }

    const recent = (clickHistory.get(key) || []).filter((t) => timestamp - t <= RAGE_WINDOW_MS);
    recent.push(timestamp);
    clickHistory.set(key, recent);

    if (recent.length >= RAGE_CLICK_THRESHOLD) {
      emit('rage_click', selector, page, timestamp);
      rageCooldown.set(key, timestamp + RAGE_COOLDOWN_MS);
      clickHistory.set(key, [timestamp]);
    }
  };

  const scheduleDeadClickCheck = (selector: string, pageAtClick: string, clickTimestamp: number) => {
    const mutationVersionAtClick = mutationVersion;

    window.setTimeout(() => {
      if (!started) {
        return;
      }

      if (mutationVersion === mutationVersionAtClick && pageAtClick === currentPage()) {
        emit('dead_click', selector, pageAtClick, clickTimestamp + DEAD_CLICK_DELAY_MS);
      }
    }, DEAD_CLICK_DELAY_MS);
  };

  const handleClick = (event: MouseEvent) => {
    if (!event.isTrusted) {
      return;
    }

    const selector = getStableSelector(event.target);
    const page = currentPage();
    const timestamp = Date.now();

    emit('click', selector, page, timestamp);
    handleRageClick(selector, page, timestamp);
    scheduleDeadClickCheck(selector, page, timestamp);
  };

  const handleBeforeUnload = () => {
    emit('page_exit', 'beforeunload', currentPage(), Date.now());
    transport.flushSync('beforeunload');
  };

  const handlePageHide = () => {
    emit('page_exit', 'pagehide', currentPage(), Date.now());
    transport.flushSync('pagehide');
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      transport.flushSync('visibility_hidden');
    }
  };

  const patchHistory = () => {
    if (originalPushState || originalReplaceState) {
      return;
    }

    originalPushState = history.pushState.bind(history);
    originalReplaceState = history.replaceState.bind(history);

    history.pushState = function pushState(...args) {
      const result = originalPushState!.apply(history, args as any);
      handleNavigation('push_state');
      return result;
    };

    history.replaceState = function replaceState(...args) {
      const result = originalReplaceState!.apply(history, args as any);
      handleNavigation('replace_state');
      return result;
    };
  };

  const unpatchHistory = () => {
    if (originalPushState) {
      history.pushState = originalPushState;
      originalPushState = null;
    }

    if (originalReplaceState) {
      history.replaceState = originalReplaceState;
      originalReplaceState = null;
    }
  };

  const start = () => {
    if (started) {
      return;
    }

    started = true;
    mutationVersion = 0;

    observer = new MutationObserver(() => {
      mutationVersion += 1;
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', popstateHandler);
    window.addEventListener('hashchange', hashchangeHandler);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    patchHistory();
    transport.start();
    handleNavigation('page_load');
  };

  const stop = () => {
    if (!started) {
      return;
    }

    started = false;

    observer?.disconnect();
    observer = null;

    document.removeEventListener('click', handleClick, true);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('popstate', popstateHandler);
    window.removeEventListener('hashchange', hashchangeHandler);

    unpatchHistory();
    transport.stop();
    clickHistory.clear();
    rageCooldown.clear();
  };

  return { start, stop };
}
