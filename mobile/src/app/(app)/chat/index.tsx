import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatConversationRow } from '@/components/chat/chat-conversation-row';
import { NewChatModal } from '@/components/chat/new-chat-modal';
import { Plus } from '@/components/icons/lucide';
import { InboxEmptyState } from '@/components/inbox/empty-state';
import { useChatAttention } from '@/contexts/chat-attention';
import { useChatConversations } from '@/hooks/use-chat-conversations';
import { findOrCreateDmConversation } from '@/lib/chat/messages';
import { useAuth } from '@/lib/auth/auth-provider';
import { pressScaleStyle, tavColors } from '@/lib/theme';

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default function ChatListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ user?: string | string[] }>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { conversations, isLoading, error, refresh } = useChatConversations();
  const { refreshUnreadCount } = useChatAttention();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const peerUserId = firstParam(params.user)?.trim() || null;

  useEffect(() => {
    if (!peerUserId || deepLinkHandled || isLoading) {
      return;
    }

    let cancelled = false;
    void findOrCreateDmConversation(peerUserId)
      .then((conversation) => {
        if (!cancelled) {
          setDeepLinkHandled(true);
          router.replace(`/(app)/chat/${conversation.id}` as Href);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeepLinkHandled(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [deepLinkHandled, isLoading, peerUserId, router]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshUnreadCount()]);
    setRefreshing(false);
  }, [refresh, refreshUnreadCount]);

  const listHeader = useMemo(
    () => (
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Chats</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNewChatOpen(true)}
          style={({ pressed }) => [styles.newButton, pressScaleStyle(pressed)]}>
          <Plus color={tavColors.blue} size={22} strokeWidth={2.4} />
        </Pressable>
      </View>
    ),
    [insets.top],
  );

  return (
    <View style={styles.screen}>
      {listHeader}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : null}

      {isLoading && conversations.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={tavColors.blue} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatConversationRow
              conversation={item}
              currentUserId={session?.user.id}
              onPress={() => {
                router.push(`/(app)/chat/${item.id}` as Href);
              }}
            />
          )}
          ListEmptyComponent={
            <InboxEmptyState
              title="No conversations yet"
              description="Start a direct message or group chat with your teammates."
            />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
          }
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
        />
      )}

      <NewChatModal
        visible={newChatOpen}
        initialPeerUserId={peerUserId}
        onClose={() => setNewChatOpen(false)}
        onCreated={(conversationId) => {
          void refresh();
          void refreshUnreadCount();
          router.push(`/(app)/chat/${conversationId}` as Href);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tavColors.threadListBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: tavColors.zinc900,
  },
  newButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc100,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  errorBanner: {
    backgroundColor: tavColors.red50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: tavColors.red600,
    fontSize: 14,
  },
});
