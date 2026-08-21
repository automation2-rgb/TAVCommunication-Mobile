import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AttachmentLightbox } from '@/components/inbox/attachment-lightbox';
import { AttachmentThumbnail } from '@/components/inbox/attachment-thumbnail';
import { MessageStatusIcon } from '@/components/inbox/message-status-icon';
import { formatMessageTime } from '@/lib/format-time';
import type { PendingAttachmentPreview } from '@/lib/messaging/send-message';
import { isFailedMessageStatus } from '@/lib/messaging/send-message';
import { isImageMimeType } from '@/lib/messaging/mms-policy';
import {
  inboundBubbleRadii,
  outboundBubbleRadii,
  pressScaleStyle,
  tavColors,
  tavLayout,
  tavTypography,
} from '@/lib/theme';
import type { Message, MessageAttachment } from '@/types/messaging';

type MessageBubbleProps = {
  message: Message;
  attachments?: MessageAttachment[];
  pendingAttachments?: PendingAttachmentPreview[];
  isSelf: boolean;
  compactTop?: boolean;
  highlighted?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
  onLongPress?: () => void;
};

function PendingAttachmentThumbnail({
  attachment,
  outbound,
}: {
  attachment: PendingAttachmentPreview;
  outbound: boolean;
}) {
  const label = attachment.filename?.trim() || 'Attachment';

  return (
    <View style={[styles.pendingTile, outbound && styles.pendingTileOutbound]}>
      {isImageMimeType(attachment.content_type) ? (
        <Image contentFit="cover" source={{ uri: attachment.uri }} style={styles.pendingImage} />
      ) : (
        <View style={styles.pendingFile}>
          <Text style={[styles.pendingFileIcon, outbound && styles.pendingFileIconOutbound]}>📎</Text>
          <Text numberOfLines={2} style={[styles.pendingFileLabel, outbound && styles.pendingFileLabelOutbound]}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
}

export function MessageBubble({
  message,
  attachments = [],
  pendingAttachments = [],
  isSelf,
  compactTop = false,
  highlighted = false,
  onRetry,
  isRetrying = false,
  onLongPress,
}: MessageBubbleProps) {
  const outbound = message.direction === 'outbound';
  const body = message.body?.trim() || '';
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const timeLabel = formatMessageTime(message.created_at);

  const sortedAttachments = useMemo(
    () => [...attachments].sort((a, b) => a.id.localeCompare(b.id)),
    [attachments],
  );

  const showPending = sortedAttachments.length === 0 && pendingAttachments.length > 0;
  const failed = isFailedMessageStatus(message.status);
  const showRetry = failed && outbound && Boolean(onRetry);

  const bubbleContent = (
    <>
      {body ? <Text style={[styles.body, outbound && styles.bodyOutbound]}>{body}</Text> : null}

      {sortedAttachments.length > 0 ? (
        <View style={styles.attachmentGrid}>
          {sortedAttachments.map((attachment, index) => (
            <AttachmentThumbnail
              key={attachment.id}
              attachment={attachment}
              outbound={outbound}
              onPress={() => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
            />
          ))}
        </View>
      ) : null}

      {showPending ? (
        <View style={styles.attachmentGrid}>
          {pendingAttachments.map((attachment) => (
            <PendingAttachmentThumbnail key={attachment.id} attachment={attachment} outbound={outbound} />
          ))}
        </View>
      ) : null}

      {outbound ? (
        <View style={styles.metaRow}>
          <MessageStatusIcon status={message.status} outbound />
          {timeLabel ? <Text style={styles.outboundTime}>{timeLabel}</Text> : null}
        </View>
      ) : null}

      {showRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry sending message"
          disabled={isRetrying}
          onPress={onRetry}
          style={({ pressed }) => [styles.retryPill, pressScaleStyle(pressed), isRetrying && styles.retryPillDisabled]}>
          {isRetrying ? (
            <ActivityIndicator color={tavColors.blue} size="small" />
          ) : (
            <Text style={styles.retryLabel}>Retry</Text>
          )}
        </Pressable>
      ) : null}
    </>
  );

  const bubbleShell = outbound ? (
    <LinearGradient
      colors={[
        tavColors.bubbleOutGradientTop,
        tavColors.bubbleOutGradientMid,
        tavColors.bubbleOutGradientBottom,
      ]}
      locations={[0, 0.42, 1]}
      style={[
        styles.bubble,
        outboundBubbleRadii(),
        failed && styles.bubbleFailed,
        { maxWidth: `${tavLayout.maxBubbleWidthRatio * 100}%` as `${number}%` },
      ]}>
      {bubbleContent}
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.bubble,
        styles.bubbleInbound,
        inboundBubbleRadii(),
        { maxWidth: `${tavLayout.maxBubbleWidthRatio * 100}%` as `${number}%` },
      ]}>
      {bubbleContent}
    </View>
  );

  return (
    <>
      <View
        style={[
          styles.row,
          outbound ? styles.rowOutbound : styles.rowInbound,
          compactTop && styles.rowCompactTop,
          highlighted && styles.rowHighlighted,
        ]}>
        {onLongPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityHint="Opens message actions"
            delayLongPress={400}
            onLongPress={onLongPress}
            style={({ pressed }) => [pressed && styles.bubblePressed]}>
            {bubbleShell}
          </Pressable>
        ) : (
          bubbleShell
        )}
      </View>

      {!outbound && timeLabel ? <Text style={styles.inboundTime}>{timeLabel}</Text> : null}

      <AttachmentLightbox
        attachments={sortedAttachments}
        initialIndex={lightboxIndex}
        visible={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  rowCompactTop: {
    marginTop: -2,
  },
  rowOutbound: {
    alignItems: 'flex-end',
  },
  rowInbound: {
    alignItems: 'flex-start',
  },
  rowHighlighted: {
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
    borderRadius: 16,
    marginHorizontal: 8,
    paddingHorizontal: 8,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  bubbleInbound: {
    backgroundColor: tavColors.bubbleIn,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleFailed: {
    borderWidth: 2,
    borderColor: tavColors.red600,
  },
  bubblePressed: {
    opacity: 0.92,
  },
  body: {
    ...tavTypography.messageBody,
    color: tavColors.black,
  },
  bodyOutbound: {
    color: tavColors.white,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 2,
  },
  retryPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    minHeight: 32,
    minWidth: 72,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: tavColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryPillDisabled: {
    opacity: 0.7,
  },
  retryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.blue,
  },
  outboundTime: {
    fontSize: 10,
    lineHeight: 12,
    color: tavColors.bubbleOutDim,
  },
  inboundTime: {
    fontSize: 10,
    lineHeight: 12,
    color: tavColors.zinc400,
    paddingLeft: 18,
    marginTop: 2,
    marginBottom: 4,
  },
  pendingTile: {
    width: 132,
    height: 132,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: tavColors.zinc100,
  },
  pendingTileOutbound: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pendingImage: {
    width: '100%',
    height: '100%',
  },
  pendingFile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  pendingFileIcon: {
    fontSize: 24,
  },
  pendingFileIconOutbound: {
    color: tavColors.white,
  },
  pendingFileLabel: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: tavColors.zinc700,
  },
  pendingFileLabelOutbound: {
    color: tavColors.white,
  },
});
