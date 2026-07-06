import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { MessageBubble } from '@/components/inbox/message-bubble';
import { InboxEmptyState } from '@/components/inbox/empty-state';
import { tavColors } from '@/lib/theme';
import type { Message } from '@/types/messaging';

type MessageListProps = {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
};

export function MessageList({
  messages,
  currentUserId,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadOlder,
}: MessageListProps) {
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
        <MessageBubble message={item} isSelf={item.direction === 'outbound' && item.sent_by === currentUserId} />
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
