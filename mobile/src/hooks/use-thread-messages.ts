import { useCallback, useEffect, useState } from 'react';

import {
  fetchMessagesPage,
  mergeMessagesById,
  removeMessage,
  upsertMessage,
} from '@/lib/messaging/messages';
import { subscribeToThreadMessages, unsubscribeChannel } from '@/lib/messaging/realtime';
import {
  cancelScheduledMarkThreadRead,
  scheduleMarkThreadRead,
} from '@/lib/messaging/thread-reads';
import { latestInboundTimestamp, shouldAutoMarkRead } from '@/lib/messaging/unread';
import type { Message } from '@/types/messaging';

export function useThreadMessages(params: {
  threadId: string | undefined;
  userId: string | undefined;
  readAt: string | null | undefined;
  autoMarkRead?: boolean;
}) {
  const { threadId, userId, readAt, autoMarkRead = true } = params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(threadId));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      setHasMore(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const page = await fetchMessagesPage(threadId);
      setMessages(page.messages);
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load messages.'));
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  const loadOlder = useCallback(async () => {
    if (!threadId || !hasMore || isLoadingMore) {
      return;
    }

    const oldest = messages[messages.length - 1];
    if (!oldest) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await fetchMessagesPage(threadId, { beforeCreatedAt: oldest.created_at });
      setMessages((current) => mergeMessagesById(current, page.messages));
      setHasMore(page.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load older messages.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, messages, threadId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!threadId) {
      return;
    }

    const channel = subscribeToThreadMessages(threadId, {
      onInsert: (message) => {
        setMessages((current) => upsertMessage(current, message));
      },
      onUpdate: (message) => {
        setMessages((current) => upsertMessage(current, message));
      },
      onDelete: (messageId) => {
        setMessages((current) => removeMessage(current, messageId));
      },
    });

    return () => {
      void unsubscribeChannel(channel);
    };
  }, [threadId]);

  useEffect(() => {
    if (!autoMarkRead || !threadId || !userId || messages.length === 0) {
      return;
    }

    const latestInboundAt = latestInboundTimestamp(messages);
    if (!shouldAutoMarkRead({ threadId, latestInboundMessageAt: latestInboundAt, readAt })) {
      return;
    }

    scheduleMarkThreadRead(userId, threadId);
  }, [autoMarkRead, messages, readAt, threadId, userId]);

  useEffect(() => {
    if (!threadId || !userId) {
      return;
    }

    return () => {
      cancelScheduledMarkThreadRead(userId, threadId);
    };
  }, [threadId, userId]);

  return {
    messages,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    refresh,
    loadOlder,
  };
}
