import { useCallback, useEffect, useState } from 'react';

import {
  buildThreadReadMap,
  fetchThreadReads,
  markThreadUnread,
  upsertThreadRead,
} from '@/lib/messaging/thread-reads';
import type { ThreadRead } from '@/types/messaging';

export function useThreadReads(userId: string | undefined, threadIds: string[]) {
  const [reads, setReads] = useState<ThreadRead[]>([]);
  const [readMap, setReadMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(Boolean(userId && threadIds.length > 0));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || threadIds.length === 0) {
      setReads([]);
      setReadMap(new Map());
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextReads = await fetchThreadReads(userId, threadIds);
      setReads(nextReads);
      setReadMap(buildThreadReadMap(nextReads));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load read state.'));
    } finally {
      setIsLoading(false);
    }
  }, [threadIds, userId]);

  const markRead = useCallback(
    async (threadId: string) => {
      if (!userId) {
        return;
      }

      const readAt = new Date().toISOString();
      await upsertThreadRead(userId, threadId, readAt);
      setReads((current) => {
        const without = current.filter((read) => read.thread_id !== threadId);
        return [...without, { user_id: userId, thread_id: threadId, read_at: readAt }];
      });
      setReadMap((current) => {
        const next = new Map(current);
        next.set(threadId, readAt);
        return next;
      });
    },
    [userId],
  );

  const markUnread = useCallback(
    async (threadId: string) => {
      if (!userId) {
        return;
      }

      const readAt = '1970-01-01T00:00:00.000Z';
      await markThreadUnread(userId, threadId);
      setReads((current) => {
        const without = current.filter((read) => read.thread_id !== threadId);
        return [...without, { user_id: userId, thread_id: threadId, read_at: readAt }];
      });
      setReadMap((current) => {
        const next = new Map(current);
        next.set(threadId, readAt);
        return next;
      });
    },
    [userId],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    reads,
    readMap,
    isLoading,
    error,
    refresh,
    markRead,
    markUnread,
  };
}
