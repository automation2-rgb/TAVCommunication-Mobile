import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/components/avatars/user-avatar';
import { formatRelativeTime } from '@/lib/format-time';
import { formatChatConversationTitle } from '@/lib/chat/messages';
import { pressScaleStyle, tavColors } from '@/lib/theme';
import type { ChatConversation } from '@/types/chat';

type ChatConversationRowProps = {
  conversation: ChatConversation;
  currentUserId?: string;
  onPress: () => void;
};

export function ChatConversationRow({
  conversation,
  currentUserId,
  onPress,
}: ChatConversationRowProps) {
  const title = formatChatConversationTitle(conversation, currentUserId, conversation.members);
  const preview = conversation.last_message_body?.trim() || 'No messages yet';
  const timeLabel = formatRelativeTime(conversation.last_message_at);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressScaleStyle(pressed), conversation.unread && styles.unreadRow]}>
      {conversation.kind === 'dm' ? (
        <UserAvatar
          avatarStoragePath={conversation.peer?.avatar_storage_path}
          displayName={conversation.peer?.display_name}
          email={conversation.peer?.email}
          size={44}
          variant="contact"
        />
      ) : (
        <View style={styles.groupAvatar}>
          <Text style={styles.groupAvatarText}>{title.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, conversation.unread && styles.titleUnread]}>
            {title}
          </Text>
          {timeLabel ? <Text style={styles.time}>{timeLabel}</Text> : null}
        </View>
        <Text numberOfLines={1} style={[styles.preview, conversation.unread && styles.previewUnread]}>
          {preview}
        </Text>
      </View>
      {conversation.unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  unreadRow: {
    backgroundColor: tavColors.zinc50,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tavColors.zinc200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: tavColors.zinc700,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
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
  time: {
    fontSize: 12,
    color: tavColors.zinc500,
  },
  preview: {
    fontSize: 14,
    color: tavColors.zinc500,
  },
  previewUnread: {
    color: tavColors.zinc800,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tavColors.blue,
  },
});
