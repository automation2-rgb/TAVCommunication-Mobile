import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatMessageList } from '@/components/chat/chat-message-list';
import { ArrowLeft } from '@/components/icons/lucide';
import { Composer, type ComposerSendPayload } from '@/components/inbox/composer';
import { useChatAttention } from '@/contexts/chat-attention';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useChatConversations } from '@/hooks/use-chat-conversations';
import { ChatApiError } from '@/lib/chat/chat-api';
import { formatChatConversationTitle, sendChatMessage } from '@/lib/chat/messages';
import { useAuth } from '@/lib/auth/auth-provider';
import { pressScaleStyle, tavColors } from '@/lib/theme';
import type { ChatMessage } from '@/types/chat';

export default function ChatConversationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { conversations } = useChatConversations();
  const { refreshUnreadCount } = useChatAttention();
  const {
    messages,
    attachmentsByMessageId,
    isLoading,
    appendOptimistic,
    replaceMessage,
    removeMessage,
  } = useChatMessages(conversationId, Boolean(session && conversationId));

  const [isSending, setIsSending] = useState(false);

  const conversation = useMemo(
    () => conversations.find((item) => item.id === conversationId) ?? null,
    [conversationId, conversations],
  );

  const title = conversation
    ? formatChatConversationTitle(conversation, userId, conversation.members)
    : 'Chat';

  const memberNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of conversation?.members ?? []) {
      map[member.user_id] = member.display_name?.trim() || member.email?.trim() || 'Teammate';
    }
    if (conversation?.peer) {
      map[conversation.peer.user_id] =
        conversation.peer.display_name?.trim() || conversation.peer.email?.trim() || 'Teammate';
    }
    return map;
  }, [conversation]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [messages.length, refreshUnreadCount]);

  const handleSend = useCallback(
    async ({ body, files }: ComposerSendPayload) => {
      if (!conversationId || !userId) {
        return;
      }

      const tempId = `optimistic-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        conversation_id: conversationId,
        sender_user_id: userId,
        body: body.trim() || null,
        created_at: new Date().toISOString(),
      };

      appendOptimistic(optimistic);
      setIsSending(true);

      try {
        const saved = await sendChatMessage({
          conversationId,
          body,
          files,
        });
        replaceMessage(tempId, saved);
        await refreshUnreadCount();
      } catch (error) {
        removeMessage(tempId);
        Alert.alert(
          'Unable to send',
          error instanceof ChatApiError ? error.message : 'Please try again.',
        );
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [
      appendOptimistic,
      conversationId,
      refreshUnreadCount,
      removeMessage,
      replaceMessage,
      userId,
    ],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/(app)/chat' as Href);
          }}
          style={({ pressed }) => [styles.backButton, pressScaleStyle(pressed)]}>
          <ArrowLeft color={tavColors.zinc700} size={20} strokeWidth={2.2} />
        </Pressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.messages}>
        <ChatMessageList
          messages={messages}
          attachmentsByMessageId={attachmentsByMessageId}
          currentUserId={userId ?? ''}
          isLoading={isLoading}
          isGroup={conversation?.kind === 'group'}
          memberNames={memberNames}
        />
      </View>

      <Composer isSending={isSending} onSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tavColors.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    backgroundColor: tavColors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: tavColors.zinc900,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  messages: {
    flex: 1,
    backgroundColor: tavColors.canvas,
  },
});
