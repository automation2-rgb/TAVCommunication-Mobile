import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  mergeThreadList,
  removeThreadFromList,
  subscribeToInboxThreads,
  unsubscribeChannel,
} from '@/lib/messaging/realtime';
import { buildThreadReadMap, fetchThreadReads } from '@/lib/messaging/thread-reads';
import { fetchThreadsForInbox } from '@/lib/messaging/threads';
import { isThreadUnread } from '@/lib/messaging/unread';
import type { Thread, ThreadListTab } from '@/types/messaging';

export function useInboxThreads(params: {
  userId: string | undefined;
  inboxId: string | undefined;
  tab: ThreadListTab;
}) {
  const { userId, inboxId, tab } = params;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [readMap, setReadMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(Boolean(inboxId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!inboxId) {
      setThreads([]);
      setReadMap(new Map());
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const dbTab = tab === 'done' ? 'done' : 'active';
      const nextThreads = await fetchThreadsForInbox(inboxId, dbTab);

      if (userId) {
        const reads = await fetchThreadReads(
          userId,
          nextThreads.map((thread) => thread.id),
        );
        setReadMap(buildThreadReadMap(reads));
      } else {
        setReadMap(new Map());
      }

      setThreads(nextThreads);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load threads.'));
    } finally {
      setIsLoading(false);
    }
  }, [inboxId, tab, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!inboxId) {
      return;
    }

    const channel = subscribeToInboxThreads(inboxId, {
      onInsert: (thread) => {
        setThreads((current) => mergeThreadList(current, thread));
      },
      onUpdate: (thread) => {
        setThreads((current) => mergeThreadList(current, thread));
      },
      onDelete: (threadId) => {
        setThreads((current) => removeThreadFromList(current, threadId));
      },
    });

    return () => {
      void unsubscribeChannel(channel);
    };
  }, [inboxId]);

  const visibleThreads = useMemo(() => {
    if (tab !== 'unread') {
      return threads;
    }

    return threads.filter((thread) => isThreadUnread(thread, readMap.get(thread.id)));
  }, [readMap, tab, threads]);

  const unreadCount = useMemo(
    () => threads.filter((thread) => isThreadUnread(thread, readMap.get(thread.id))).length,
    [readMap, threads],
  );

  return {
    threads: visibleThreads,
    allThreads: threads,
    readMap,
    setReadMap,
    unreadCount,
    isLoading,
    error,
    refresh,
  };
}
