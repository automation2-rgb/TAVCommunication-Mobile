import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { formatRelativeTime } from '@/lib/format-time';
import { formatThreadTitle } from '@/lib/messaging/threads';
import { isThreadUnread } from '@/lib/messaging/unread';
import { tavColors, tavTypography } from '@/lib/theme';
import type { Thread } from '@/types/messaging';

type ThreadRowProps = {
  thread: Thread;
  readAt?: string | null;
  onPress: () => void;
  onLongPress: () => void;
};

function formatSnippet(thread: Thread): string {
  const raw = thread.last_message_body?.trim() || 'No messages yet';
  if (thread.last_message_direction === 'outbound') {
    return `You: ${raw}`;
  }
  return raw;
}

export function ThreadRow({ thread, readAt, onPress, onLongPress }: ThreadRowProps) {
  const unread = isThreadUnread(thread, readAt);
  const title = formatThreadTitle(thread);
  const snippet = formatSnippet(thread);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        unread && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}>
      <ContactAvatar
        displayName={thread.display_name}
        phoneE164={thread.customer_e164}
        showUnreadDot={unread}
        size="md"
      />
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.timestamp}>{formatRelativeTime(thread.last_message_at)}</Text>
        </View>
        <Text style={[styles.snippet, unread && styles.snippetUnread]} numberOfLines={2}>
          {snippet}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc50,
  },
  rowUnread: {
    borderLeftWidth: 3,
    borderLeftColor: tavColors.blue,
    backgroundColor: 'rgba(244, 244, 245, 0.5)',
  },
  rowPressed: {
    backgroundColor: tavColors.zinc50,
  },
  content: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    ...tavTypography.threadTitle,
    color: tavColors.zinc900,
  },
  titleUnread: {
    ...tavTypography.threadTitleUnread,
  },
  timestamp: {
    ...tavTypography.meta,
    color: tavColors.zinc500,
  },
  snippet: {
    ...tavTypography.threadSnippet,
  },
  snippetUnread: {
    fontWeight: '500',
    color: tavColors.zinc800,
  },
});
