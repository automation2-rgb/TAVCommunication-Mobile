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

import { fetchChatConversations } from '@/lib/chat/conversations';

type ChatAttentionContextValue = {
  unreadConversationCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const ChatAttentionContext = createContext<ChatAttentionContextValue | null>(null);

const POLL_MS = 90_000;

export function ChatAttentionProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [unreadConversationCount, setUnreadConversationCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!enabled) {
      setUnreadConversationCount(0);
      return;
    }

    try {
      const conversations = await fetchChatConversations();
      const count = conversations.filter((conversation) => conversation.unread).length;
      setUnreadConversationCount(count);
    } catch {
      // Badge is optional; ignore polling failures.
    }
  }, [enabled]);

  useFocusEffect(
    useCallback(() => {
      void refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

  useEffect(() => {
    if (!enabled) {
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
  }, [enabled, refreshUnreadCount]);

  const value = useMemo(
    () => ({ unreadConversationCount, refreshUnreadCount }),
    [refreshUnreadCount, unreadConversationCount],
  );

  return <ChatAttentionContext.Provider value={value}>{children}</ChatAttentionContext.Provider>;
}

export function useChatAttention() {
  const context = useContext(ChatAttentionContext);
  if (!context) {
    throw new Error('useChatAttention must be used within ChatAttentionProvider');
  }
  return context;
}

export function formatChatBadgeCount(count: number) {
  if (count <= 0) {
    return null;
  }
  return count > 99 ? '99+' : String(count);
}
