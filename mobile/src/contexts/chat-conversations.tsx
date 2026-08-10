import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { apiListChatConversations } from '@/lib/chat/chat-api';
import { subscribeToChatConversations } from '@/lib/chat/realtime';
import type { ChatConversation } from '@/types/chat';

type ChatConversationsContextValue = {
  conversations: ChatConversation[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const ChatConversationsContext = createContext<ChatConversationsContextValue | null>(null);

function sortConversations(rows: ChatConversation[]) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime(),
  );
}

export function ChatConversationsProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setConversations([]);
      return;
    }

    setError(null);
    try {
      const rows = await apiListChatConversations();
      setConversations(sortConversations(rows));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load chats.'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setConversations([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    void refresh();
    return subscribeToChatConversations(() => {
      void refresh();
    });
  }, [enabled, refresh]);

  const value = useMemo(
    () => ({ conversations, isLoading, error, refresh }),
    [conversations, error, isLoading, refresh],
  );

  return (
    <ChatConversationsContext.Provider value={value}>{children}</ChatConversationsContext.Provider>
  );
}

export function useChatConversations() {
  const context = useContext(ChatConversationsContext);
  if (!context) {
    throw new Error('useChatConversations must be used within ChatConversationsProvider');
  }
  return context;
}
