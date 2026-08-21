import { useFocusEffect } from 'expo-router';
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

import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useAuth } from '@/lib/auth/auth-provider';
import { fetchTotalInboxUnreadCount } from '@/lib/messaging/inbox-unread';

type InboxAttentionContextValue = {
  totalUnreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const InboxAttentionContext = createContext<InboxAttentionContextValue | null>(null);

const POLL_MS = 90_000;

export function InboxAttentionProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { inboxes } = useInboxWorkspace();
  const inboxIds = useMemo(() => inboxes.map((inbox) => inbox.id), [inboxes]);
  const inboxKey = inboxIds.join(',');

  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled || !userId || inboxIds.length === 0) {
      setTotalUnreadCount(0);
      return;
    }

    try {
      const count = await fetchTotalInboxUnreadCount(userId, inboxIds);
      setTotalUnreadCount(count);
    } catch {
      // Badge is optional; ignore polling failures.
    }
  }, [enabled, inboxIds, userId]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

  useEffect(() => {
    if (!enabled) {
      setTotalUnreadCount(0);
      return;
    }

    void refreshUnreadCount();
    const timer = setInterval(() => {
      void refreshUnreadCount();
    }, POLL_MS);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshUnreadCount();
      }
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled, inboxKey, refreshUnreadCount]);

  const value = useMemo(
    () => ({ totalUnreadCount, refreshUnreadCount }),
    [refreshUnreadCount, totalUnreadCount],
  );

  return <InboxAttentionContext.Provider value={value}>{children}</InboxAttentionContext.Provider>;
}

export function useInboxAttention() {
  const context = useContext(InboxAttentionContext);
  if (!context) {
    throw new Error('useInboxAttention must be used within InboxAttentionProvider');
  }
  return context;
}

export function formatInboxBadgeCount(count: number) {
  if (count <= 0) {
    return null;
  }
  return count > 99 ? '99+' : String(count);
}
