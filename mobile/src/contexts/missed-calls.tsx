import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { getCallsLastSeenAt } from '@/lib/voice/calls-last-seen';
import { fetchMissedCallCount } from '@/lib/voice/missed-count';

const POLL_INTERVAL_MS = 90_000;

type MissedCallsContextValue = {
  unseenMissedCount: number;
  refreshMissedCount: () => Promise<void>;
};

const MissedCallsContext = createContext<MissedCallsContextValue | null>(null);

export function MissedCallsProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [unseenMissedCount, setUnseenMissedCount] = useState(0);

  const refreshMissedCount = useCallback(async () => {
    if (!enabled) {
      setUnseenMissedCount(0);
      return;
    }

    try {
      const since = await getCallsLastSeenAt();
      const result = await fetchMissedCallCount(since);
      setUnseenMissedCount(result.unseenMissedCount ?? 0);
    } catch {
      // Keep the last known count when polling fails offline.
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setUnseenMissedCount(0);
      return;
    }

    void refreshMissedCount();
    const interval = setInterval(() => {
      void refreshMissedCount();
    }, POLL_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshMissedCount();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [enabled, refreshMissedCount]);

  const value = useMemo(
    () => ({
      unseenMissedCount,
      refreshMissedCount,
    }),
    [refreshMissedCount, unseenMissedCount],
  );

  return <MissedCallsContext.Provider value={value}>{children}</MissedCallsContext.Provider>;
}

export function useMissedCalls() {
  const context = useContext(MissedCallsContext);
  if (!context) {
    throw new Error('useMissedCalls must be used within MissedCallsProvider');
  }

  return context;
}

export function formatMissedBadgeCount(count: number): string {
  if (count <= 0) {
    return '';
  }

  return count > 99 ? '99+' : String(count);
}
