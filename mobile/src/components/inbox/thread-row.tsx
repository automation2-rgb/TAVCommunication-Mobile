import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { Archive } from '@/components/icons/lucide';
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
  const isDone = Boolean(thread.archived_at);
  const unread = !isDone && isThreadUnread(thread, readAt);
  const title = formatThreadTitle(thread);
  const snippet = formatSnippet(thread);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDone ? `${title}, done deal` : title}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.row,
        isDone && styles.rowDone,
        unread && styles.rowUnread,
        pressed && (isDone ? styles.rowDonePressed : styles.rowPressed),
      ]}>
      <View style={isDone ? styles.avatarDone : undefined}>
        <ContactAvatar
          displayName={thread.display_name}
          phoneE164={thread.customer_e164}
          showUnreadDot={unread}
          size="md"
        />
      </View>
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text
            style={[styles.title, isDone && styles.titleDone, unread && styles.titleUnread]}
            numberOfLines={1}>
            {title}
          </Text>
          {isDone ? (
            <View style={styles.doneBadge}>
              <Archive color={tavColors.zinc600} size={12} strokeWidth={2.2} />
              <Text style={styles.doneBadgeText}>Done</Text>
            </View>
          ) : null}
          <Text style={[styles.timestamp, isDone && styles.timestampDone]}>
            {formatRelativeTime(thread.last_message_at)}
          </Text>
        </View>
        <Text style={[styles.snippet, isDone && styles.snippetDone, unread && styles.snippetUnread]} numberOfLines={2}>
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
  rowDone: {
    backgroundColor: tavColors.zinc50,
  },
  rowDonePressed: {
    backgroundColor: tavColors.zinc100,
  },
  rowUnread: {
    borderLeftWidth: 3,
    borderLeftColor: tavColors.blue,
    backgroundColor: 'rgba(244, 244, 245, 0.5)',
  },
  rowPressed: {
    backgroundColor: tavColors.zinc50,
  },
  avatarDone: {
    opacity: 0.72,
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
  titleDone: {
    color: tavColors.zinc500,
    fontWeight: '500',
  },
  titleUnread: {
    ...tavTypography.threadTitleUnread,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: tavColors.zinc200,
  },
  doneBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: tavColors.zinc600,
  },
  timestamp: {
    ...tavTypography.meta,
    color: tavColors.zinc500,
    flexShrink: 0,
  },
  timestampDone: {
    color: tavColors.zinc400,
  },
  snippet: {
    ...tavTypography.threadSnippet,
  },
  snippetDone: {
    color: tavColors.zinc400,
  },
  snippetUnread: {
    fontWeight: '500',
    color: tavColors.zinc800,
  },
});
