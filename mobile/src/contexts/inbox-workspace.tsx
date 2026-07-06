import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

import { useUserInboxes } from '@/hooks/use-user-inboxes';
import type { Inbox, ThreadListTab } from '@/types/messaging';

const ACTIVE_INBOX_KEY = 'tav_mobile_active_inbox_id';

type InboxWorkspaceContextValue = {
  inboxes: Inbox[];
  activeInbox: Inbox | null;
  activeInboxId: string | null;
  setActiveInboxId: (inboxId: string) => void;
  activeTab: ThreadListTab;
  setActiveTab: (tab: ThreadListTab) => void;
  isLoadingInboxes: boolean;
  inboxesError: Error | null;
  refreshInboxes: () => Promise<void>;
};

const InboxWorkspaceContext = createContext<InboxWorkspaceContextValue | null>(null);

export function InboxWorkspaceProvider({
  userId,
  children,
}: {
  userId: string | undefined;
  children: ReactNode;
}) {
  const { inboxes, isLoading, error, refresh } = useUserInboxes(userId);
  const [activeInboxId, setActiveInboxIdState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ThreadListTab>('active');

  useEffect(() => {
    let mounted = true;

    void SecureStore.getItemAsync(ACTIVE_INBOX_KEY)
      .then((stored) => {
        if (mounted && stored) {
          setActiveInboxIdState(stored);
        }
      })
      .catch(() => {
        // Ignore corrupt or legacy stored keys.
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (inboxes.length === 0) {
      return;
    }

    const stillValid = activeInboxId && inboxes.some((inbox) => inbox.id === activeInboxId);
    if (!stillValid) {
      const nextId = inboxes[0].id;
      setActiveInboxIdState(nextId);
      void SecureStore.setItemAsync(ACTIVE_INBOX_KEY, nextId).catch(() => undefined);
    }
  }, [activeInboxId, inboxes]);

  const setActiveInboxId = useCallback((inboxId: string) => {
    setActiveInboxIdState(inboxId);
    void SecureStore.setItemAsync(ACTIVE_INBOX_KEY, inboxId).catch(() => undefined);
  }, []);

  const activeInbox = useMemo(
    () => inboxes.find((inbox) => inbox.id === activeInboxId) ?? null,
    [activeInboxId, inboxes],
  );

  const value = useMemo(
    () => ({
      inboxes,
      activeInbox,
      activeInboxId,
      setActiveInboxId,
      activeTab,
      setActiveTab,
      isLoadingInboxes: isLoading,
      inboxesError: error,
      refreshInboxes: refresh,
    }),
    [activeInbox, activeInboxId, activeTab, error, inboxes, isLoading, refresh, setActiveInboxId],
  );

  return <InboxWorkspaceContext.Provider value={value}>{children}</InboxWorkspaceContext.Provider>;
}

export function useInboxWorkspace() {
  const context = useContext(InboxWorkspaceContext);
  if (!context) {
    throw new Error('useInboxWorkspace must be used within InboxWorkspaceProvider');
  }
  return context;
}
