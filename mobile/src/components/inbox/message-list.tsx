import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { InboxEmptyState } from '@/components/inbox/empty-state';
import { MessageBubble } from '@/components/inbox/message-bubble';
import { useMessageAttachments } from '@/hooks/use-message-attachments';
import { formatMessageDateLabel, isSameCalendarDay } from '@/lib/format-time';
import type { PendingAttachmentPreview } from '@/lib/messaging/send-message';
import { tavColors, tavTypography } from '@/lib/theme';
import type { Message } from '@/types/messaging';

type MessageListProps = {
  messages: Message[];
  currentUserId: string;
  pendingAttachmentsByMessageId?: Record<string, PendingAttachmentPreview[]>;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  highlightMessageId?: string | null;
};

type MessageListItem =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'message'; id: string; message: Message; compactTop: boolean };

function buildListItems(messagesNewestFirst: Message[]): MessageListItem[] {
  const chronological = [...messagesNewestFirst].reverse();
  const built: MessageListItem[] = [];

  for (let index = 0; index < chronological.length; index += 1) {
    const message = chronological[index];
    const previous = chronological[index - 1];

    if (!previous || !isSameCalendarDay(previous.created_at, message.created_at)) {
      built.push({
        kind: 'date',
        id: `date-${message.created_at.slice(0, 10)}-${message.id}`,
        label: formatMessageDateLabel(message.created_at),
      });
    }

    const compactTop =
      Boolean(previous) &&
      previous.direction === message.direction &&
      isSameCalendarDay(previous.created_at, message.created_at);

    built.push({
      kind: 'message',
      id: message.id,
      message,
      compactTop,
    });
  }

  return built.reverse();
}

export function MessageList({
  messages,
  currentUserId,
  pendingAttachmentsByMessageId = {},
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadOlder,
  highlightMessageId = null,
}: MessageListProps) {
  const listRef = useRef<FlatList<MessageListItem>>(null);
  const messageIds = useMemo(
    () => messages.map((message) => message.id).filter((id) => !id.startsWith('optimistic-')),
    [messages],
  );
  const { byMessageId } = useMessageAttachments(messageIds);

  const listItems = useMemo(() => buildListItems(messages), [messages]);

  useEffect(() => {
    if (!highlightMessageId) {
      return;
    }

    const index = listItems.findIndex(
      (item) => item.kind === 'message' && item.message.id === highlightMessageId,
    );
    if (index < 0) {
      return;
    }

    const timer = setTimeout(() => {
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [highlightMessageId, listItems]);

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
        variant="no-messages"
      />
    );
  }

  return (
    <FlatList
      ref={listRef}
      inverted
      data={listItems}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        if (item.kind === 'date') {
          return (
            <View style={styles.dateDividerWrap}>
              <View style={styles.dateDividerPill}>
                <Text style={styles.dateDividerText}>{item.label}</Text>
              </View>
            </View>
          );
        }

        return (
          <MessageBubble
            attachments={byMessageId.get(item.message.id)}
            pendingAttachments={pendingAttachmentsByMessageId[item.message.id]}
            compactTop={item.compactTop}
            highlighted={item.message.id === highlightMessageId}
            isSelf={item.message.direction === 'outbound' && item.message.sent_by === currentUserId}
            message={item.message}
          />
        );
      }}
      contentContainerStyle={styles.listContent}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: info.index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 100);
      }}
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
    backgroundColor: tavColors.canvas,
  },
  listContent: {
    paddingVertical: 12,
    backgroundColor: tavColors.canvas,
  },
  footerLoader: {
    paddingVertical: 12,
  },
  dateDividerWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dateDividerPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dateDividerText: {
    ...tavTypography.meta,
    fontWeight: '500',
    color: tavColors.zinc600,
  },
});
