import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatRelativeTime } from '@/lib/format-time';
import { formatThreadTitle } from '@/lib/messaging/threads';
import { isThreadUnread } from '@/lib/messaging/unread';
import { tavColors } from '@/lib/theme';
import type { Thread } from '@/types/messaging';

type ThreadRowProps = {
  thread: Thread;
  readAt?: string | null;
  onPress: () => void;
  onLongPress: () => void;
};

export function ThreadRow({ thread, readAt, onPress, onLongPress }: ThreadRowProps) {
  const unread = isThreadUnread(thread, readAt);
  const title = formatThreadTitle(thread);
  const snippet = thread.last_message_body?.trim() || 'No messages yet';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.timestamp}>{formatRelativeTime(thread.last_message_at)}</Text>
        </View>
        <View style={styles.bottomLine}>
          <Text style={[styles.snippet, unread && styles.snippetUnread]} numberOfLines={2}>
            {snippet}
          </Text>
          {unread ? <View style={styles.unreadDot} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  rowPressed: {
    backgroundColor: tavColors.zinc50,
  },
  content: {
    gap: 4,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  titleUnread: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 12,
    color: tavColors.zinc500,
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snippet: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc600,
  },
  snippetUnread: {
    color: tavColors.zinc900,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tavColors.blue,
  },
});
