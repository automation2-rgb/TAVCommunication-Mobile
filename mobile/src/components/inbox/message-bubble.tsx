import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AttachmentLightbox } from '@/components/inbox/attachment-lightbox';
import { AttachmentThumbnail } from '@/components/inbox/attachment-thumbnail';
import { MessageStatusIcon } from '@/components/inbox/message-status-icon';
import type { PendingAttachmentPreview } from '@/lib/messaging/send-message';
import { isImageMimeType } from '@/lib/messaging/mms-policy';
import { tavColors, tavLayout } from '@/lib/theme';
import type { Message, MessageAttachment } from '@/types/messaging';

type MessageBubbleProps = {
  message: Message;
  attachments?: MessageAttachment[];
  pendingAttachments?: PendingAttachmentPreview[];
  isSelf: boolean;
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
}: MessageBubbleProps) {
  const outbound = message.direction === 'outbound';
  const body = message.body?.trim() || '';
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const sortedAttachments = useMemo(
    () => [...attachments].sort((a, b) => a.id.localeCompare(b.id)),
    [attachments],
  );

  const showPending = sortedAttachments.length === 0 && pendingAttachments.length > 0;

  return (
    <>
      <View style={[styles.row, outbound ? styles.rowOutbound : styles.rowInbound]}>
        <View style={[styles.bubble, outbound ? styles.bubbleOutbound : styles.bubbleInbound]}>
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
                <PendingAttachmentThumbnail
                  key={attachment.id}
                  attachment={attachment}
                  outbound={outbound}
                />
              ))}
            </View>
          ) : null}

          {outbound ? (
            <View style={styles.metaRow}>
              <MessageStatusIcon status={message.status} />
            </View>
          ) : null}
        </View>
      </View>

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
    gap: 8,
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
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
