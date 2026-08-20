import { Href, useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { SearchModal } from '@/components/search/search-modal';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { fetchThreadById, fetchThreadsForInbox } from '@/lib/messaging/threads';
import { fetchThreadReads } from '@/lib/messaging/thread-reads';
import { isThreadUnread } from '@/lib/messaging/unread';
import { useAuth } from '@/lib/auth/auth-provider';
import type { SearchRecentThread, SearchSelectPayload } from '@/types/search';
import type { Thread } from '@/types/messaging';

type WorkspaceSearchContextValue = {
  openSearch: () => void;
  closeSearch: () => void;
};

const WorkspaceSearchContext = createContext<WorkspaceSearchContextValue | null>(null);

function toRecentThread(thread: Thread): SearchRecentThread {
  return {
    id: thread.id,
    display_name: thread.display_name,
    customer_e164: thread.customer_e164,
    last_message_body: thread.last_message_body,
    last_message_direction: thread.last_message_direction,
    last_message_at: thread.last_message_at,
  };
}

export function WorkspaceSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const { activeInbox, activeInboxId, setActiveInboxId, setActiveTab } = useInboxWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [recentThreads, setRecentThreads] = useState<SearchRecentThread[]>([]);

  const openSearch = useCallback(() => {
    setIsOpen(true);

    if (!activeInboxId) {
      setRecentThreads([]);
      return;
    }

    void fetchThreadsForInbox(activeInboxId, 'active')
      .then((threads) => {
        setRecentThreads(threads.slice(0, 5).map(toRecentThread));
      })
      .catch(() => {
        setRecentThreads([]);
      });
  }, [activeInboxId]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelectResult = useCallback(
    async ({ inboxId, threadId, messageId }: SearchSelectPayload) => {
      const resolvedInboxId = inboxId.trim() || activeInboxId || '';
      if (!resolvedInboxId) {
        return;
      }

      if (resolvedInboxId !== activeInboxId) {
        setActiveInboxId(resolvedInboxId);
      }

      const thread = await fetchThreadById(threadId);
      if (thread) {
        if (thread.archived_at) {
          setActiveTab('done');
        } else if (userId) {
          const reads = await fetchThreadReads(userId, [threadId]);
          const readAt = reads[0]?.read_at ?? null;
          setActiveTab(isThreadUnread(thread, readAt) ? 'unread' : 'active');
        } else {
          setActiveTab('active');
        }
      }

      const href = messageId
        ? (`/(app)/inbox/${threadId}?messageId=${encodeURIComponent(messageId)}` as Href)
        : (`/(app)/inbox/${threadId}` as Href);

      router.push(href);
    },
    [activeInboxId, router, setActiveInboxId, setActiveTab, userId],
  );

  const value = useMemo(
    () => ({
      openSearch,
      closeSearch,
    }),
    [closeSearch, openSearch],
  );

  return (
    <WorkspaceSearchContext.Provider value={value}>
      {children}
      <SearchModal
        visible={isOpen}
        onClose={closeSearch}
        onSelectResult={(payload) => {
          void handleSelectResult(payload);
        }}
        recentThreads={recentThreads}
        recentInboxId={activeInboxId}
        recentInboxName={activeInbox?.display_name ?? null}
        currentUserName={profile?.display_name ?? null}
      />
    </WorkspaceSearchContext.Provider>
  );
}

export function useWorkspaceSearch() {
  const context = useContext(WorkspaceSearchContext);
  if (!context) {
    throw new Error('useWorkspaceSearch must be used within WorkspaceSearchProvider');
  }
  return context;
}
