import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { InboxEmptyState } from '@/components/inbox/empty-state';
import { MessageBubble } from '@/components/inbox/message-bubble';
import { useMessageAttachments } from '@/hooks/use-message-attachments';
import type { PendingAttachmentPreview } from '@/lib/messaging/send-message';
import { tavColors } from '@/lib/theme';
import type { Message } from '@/types/messaging';

type MessageListProps = {
  messages: Message[];
  currentUserId: string;
  pendingAttachmentsByMessageId?: Record<string, PendingAttachmentPreview[]>;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
};

export function MessageList({
  messages,
  currentUserId,
  pendingAttachmentsByMessageId = {},
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadOlder,
}: MessageListProps) {
  const messageIds = useMemo(
    () => messages.map((message) => message.id).filter((id) => !id.startsWith('optimistic-')),
    [messages],
  );
  const { byMessageId } = useMessageAttachments(messageIds);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tavColors.blue} />
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <InboxEmptyState
        title="Start the conversation"
        description="Send a message to begin this thread."
      />
    );
  }

  return (
    <FlatList
      inverted
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MessageBubble
          attachments={byMessageId.get(item.id)}
          pendingAttachments={pendingAttachmentsByMessageId[item.id]}
          isSelf={item.direction === 'outbound' && item.sent_by === currentUserId}
          message={item}
        />
      )}
      contentContainerStyle={styles.listContent}
      onEndReached={() => {
        if (hasMore && !isLoadingMore) {
          onLoadOlder();
        }
      }}
      onEndReachedThreshold={0.2}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={tavColors.blue} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
  footerLoader: {
    paddingVertical: 12,
  },
});
