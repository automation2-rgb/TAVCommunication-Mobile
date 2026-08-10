import { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { ChatMessageBubble } from '@/components/chat/chat-message-bubble';
import { InboxEmptyState } from '@/components/inbox/empty-state';
import { formatMessageDateLabel, isSameCalendarDay } from '@/lib/format-time';
import { tavColors, tavTypography } from '@/lib/theme';
import type { ChatMessage, ChatMessageAttachment } from '@/types/chat';

type ChatMessageListProps = {
  messages: ChatMessage[];
  attachmentsByMessageId: Record<string, ChatMessageAttachment[]>;
  currentUserId: string;
  isLoading: boolean;
  isGroup?: boolean;
  memberNames?: Record<string, string>;
};

type ListItem =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'message'; id: string; message: ChatMessage; compactTop: boolean };

function buildListItems(messagesNewestFirst: ChatMessage[]): ListItem[] {
  const chronological = [...messagesNewestFirst].reverse();
  const built: ListItem[] = [];

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
      previous.sender_user_id === message.sender_user_id &&
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

export function ChatMessageList({
  messages,
  attachmentsByMessageId,
  currentUserId,
  isLoading,
  isGroup = false,
  memberNames = {},
}: ChatMessageListProps) {
  const listItems = useMemo(() => buildListItems(messages), [messages]);

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
        title="No messages yet"
        description="Send a message to start the conversation."
      />
    );
  }

  return (
    <FlatList
      inverted
      data={listItems}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        if (item.kind === 'date') {
          return (
            <View style={styles.dateWrap}>
              <Text style={styles.dateLabel}>{item.label}</Text>
            </View>
          );
        }

        const isSelf = item.message.sender_user_id === currentUserId;
        return (
          <ChatMessageBubble
            message={item.message}
            attachments={attachmentsByMessageId[item.message.id] ?? []}
            isSelf={isSelf}
            compactTop={item.compactTop}
            showSenderLabel={isGroup && !isSelf}
            senderLabel={memberNames[item.message.sender_user_id] ?? 'Teammate'}
          />
        );
      }}
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
  dateWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateLabel: {
    ...tavTypography.meta,
    fontWeight: '500',
    color: tavColors.zinc600,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
