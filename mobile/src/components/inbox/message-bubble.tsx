import { StyleSheet, Text, View } from 'react-native';

import { MessageStatusIcon } from '@/components/inbox/message-status-icon';
import { tavColors, tavLayout } from '@/lib/theme';
import type { Message } from '@/types/messaging';

type MessageBubbleProps = {
  message: Message;
  isSelf: boolean;
};

export function MessageBubble({ message, isSelf }: MessageBubbleProps) {
  const outbound = message.direction === 'outbound';
  const body = message.body?.trim() || '';

  return (
    <View style={[styles.row, outbound ? styles.rowOutbound : styles.rowInbound]}>
      <View style={[styles.bubble, outbound ? styles.bubbleOutbound : styles.bubbleInbound]}>
        {body ? <Text style={[styles.body, outbound && styles.bodyOutbound]}>{body}</Text> : null}
        {outbound ? (
          <View style={styles.metaRow}>
            <MessageStatusIcon status={message.status} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  rowOutbound: {
    alignItems: 'flex-end',
  },
  rowInbound: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: tavLayout.bubbleRadius,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  bubbleOutbound: {
    backgroundColor: tavColors.bubbleOut,
  },
  bubbleInbound: {
    backgroundColor: tavColors.bubbleIn,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: tavColors.zinc900,
  },
  bodyOutbound: {
    color: tavColors.white,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
