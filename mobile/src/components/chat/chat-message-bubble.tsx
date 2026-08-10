import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatMessageTime } from '@/lib/format-time';
import {
  buildChatAttachmentUrl,
  fetchChatAttachmentHeaders,
  isChatImageMimeType,
} from '@/lib/chat/messages';
import {
  inboundBubbleRadii,
  outboundBubbleRadii,
  tavColors,
  tavLayout,
  tavTypography,
} from '@/lib/theme';
import type { ChatMessage, ChatMessageAttachment } from '@/types/chat';

type ChatMessageBubbleProps = {
  message: ChatMessage;
  attachments?: ChatMessageAttachment[];
  isSelf: boolean;
  senderLabel?: string | null;
  showSenderLabel?: boolean;
  compactTop?: boolean;
};

export function ChatMessageBubble({
  message,
  attachments = [],
  isSelf,
  senderLabel,
  showSenderLabel = false,
  compactTop = false,
}: ChatMessageBubbleProps) {
  const insets = useSafeAreaInsets();
  const outbound = isSelf;
  const body = message.body?.trim() || '';
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const timeLabel = formatMessageTime(message.created_at);

  const imageAttachments = useMemo(
    () => attachments.filter((attachment) => isChatImageMimeType(attachment.content_type)),
    [attachments],
  );

  const bubbleContent = (
    <>
      {showSenderLabel && !outbound && senderLabel ? (
        <Text style={styles.senderLabel}>{senderLabel}</Text>
      ) : null}
      {body ? <Text style={[styles.body, outbound && styles.bodyOutbound]}>{body}</Text> : null}
      {imageAttachments.length > 0 ? (
        <View style={styles.attachmentGrid}>
          {imageAttachments.map((attachment, index) => (
            <Pressable
              key={attachment.id}
              onPress={() => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}>
              <Image
                contentFit="cover"
                source={{
                  uri: buildChatAttachmentUrl(attachment.id),
                }}
                style={styles.attachmentImage}
              />
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text style={[styles.time, outbound && styles.timeOutbound]}>{timeLabel}</Text>
    </>
  );

  return (
    <>
      <View style={[styles.row, outbound ? styles.rowOutbound : styles.rowInbound]}>
        {outbound ? (
          <LinearGradient
            colors={[
              tavColors.bubbleOutGradientTop,
              tavColors.bubbleOutGradientMid,
              tavColors.bubbleOutGradientBottom,
            ]}
            style={[
              styles.bubble,
              outboundBubbleRadii(),
              styles.bubbleOutbound,
            ]}>
            {bubbleContent}
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, inboundBubbleRadii(), styles.bubbleInbound]}>
            {bubbleContent}
          </View>
        )}
      </View>

      <Modal visible={lightboxOpen} transparent animationType="fade" onRequestClose={() => setLightboxOpen(false)}>
        <Pressable style={styles.lightboxBackdrop} onPress={() => setLightboxOpen(false)}>
          <View style={[styles.lightboxBody, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
            {imageAttachments[lightboxIndex] ? (
              <Image
                contentFit="contain"
                source={{ uri: buildChatAttachmentUrl(imageAttachments[lightboxIndex].id) }}
                style={styles.lightboxImage}
              />
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  rowOutbound: {
    alignItems: 'flex-end',
  },
  rowInbound: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: `${tavLayout.maxBubbleWidthRatio * 100}%`,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  bubbleOutbound: {
    minWidth: 72,
  },
  bubbleInbound: {
    backgroundColor: tavColors.bubbleIn,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tavColors.zinc600,
    marginBottom: 2,
  },
  body: {
    ...tavTypography.messageBody,
    color: tavColors.zinc900,
  },
  bodyOutbound: {
    color: tavColors.white,
  },
  attachmentGrid: {
    gap: 6,
  },
  attachmentImage: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: tavColors.zinc200,
  },
  time: {
    fontSize: 11,
    color: tavColors.zinc500,
    alignSelf: 'flex-end',
  },
  timeOutbound: {
    color: tavColors.bubbleOutDim,
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
  },
  lightboxBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
});
