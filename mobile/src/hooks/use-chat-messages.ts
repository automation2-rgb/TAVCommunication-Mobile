import { useCallback, useEffect, useState } from 'react';

import { apiListChatMessages, apiMarkChatConversationRead } from '@/lib/chat/chat-api';
import {
  fetchChatAttachmentsForMessages,
  mergeChatMessages,
  upsertChatMessage,
} from '@/lib/chat/messages';
import { subscribeToChatMessages } from '@/lib/chat/realtime';
import type { ChatMessage, ChatMessageAttachment } from '@/types/chat';

export function useChatMessages(conversationId: string | undefined, enabled = true) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachmentsByMessageId, setAttachmentsByMessageId] = useState<
    Record<string, ChatMessageAttachment[]>
  >({});
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const loadAttachments = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) {
      return;
    }
    const grouped = await fetchChatAttachmentsForMessages(messageIds);
    setAttachmentsByMessageId((current) => ({ ...current, ...grouped }));
  }, []);

  const refresh = useCallback(async () => {
    if (!conversationId || !enabled) {
      setMessages([]);
      return;
    }

    setError(null);
    try {
      const rows = await apiListChatMessages(conversationId);
      setMessages(rows);
      await loadAttachments(rows.map((message) => message.id));
      await apiMarkChatConversationRead(conversationId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load messages.'));
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, enabled, loadAttachments]);

  useEffect(() => {
    if (!conversationId || !enabled) {
      return;
    }

    void refresh();
    return subscribeToChatMessages(conversationId, (message) => {
      setMessages((current) => upsertChatMessage(current, message));
      void loadAttachments([message.id]);
    });
  }, [conversationId, enabled, loadAttachments, refresh]);

  const appendOptimistic = useCallback((message: ChatMessage) => {
    setMessages((current) => mergeChatMessages(current, [message]));
  }, []);

  const replaceMessage = useCallback((tempId: string, next: ChatMessage) => {
    setMessages((current) => {
      const filtered = current.filter((message) => message.id !== tempId);
      return upsertChatMessage(filtered, next);
    });
    void loadAttachments([next.id]);
  }, [loadAttachments]);

  const removeMessage = useCallback((messageId: string) => {
    setMessages((current) => current.filter((message) => message.id !== messageId));
  }, []);

  return {
    messages,
    attachmentsByMessageId,
    isLoading,
    error,
    refresh,
    appendOptimistic,
    replaceMessage,
    removeMessage,
  };
}
