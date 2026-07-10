import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getAttachmentImageSource,
  resolveAttachmentMediaUrl,
} from '@/lib/messaging/attachment-url';
import { isImageMimeType } from '@/lib/messaging/mms-policy';
import { openAttachmentExternally } from '@/lib/messaging/open-attachment';
import { tavColors } from '@/lib/theme';
import type { MessageAttachment } from '@/types/messaging';

type AttachmentLightboxProps = {
  visible: boolean;
  attachments: MessageAttachment[];
  initialIndex?: number;
  onClose: () => void;
};

export function AttachmentLightbox({
  visible,
  attachments,
  initialIndex = 0,
  onClose,
}: AttachmentLightboxProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const [source, setSource] = useState<{ uri: string; headers?: Record<string, string> } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const active = attachments[index] ?? null;

  useEffect(() => {
    if (!visible) {
      return;
    }
    setIndex(Math.min(initialIndex, Math.max(attachments.length - 1, 0)));
  }, [attachments.length, initialIndex, visible]);

  useEffect(() => {
    if (!visible || !active || !isImageMimeType(active.content_type)) {
      setSource(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void getAttachmentImageSource(active.id).then((next) => {
      if (!cancelled) {
        setSource(next);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [active, visible]);

  const openExternal = async () => {
    if (!active) {
      return;
    }
    const url = await resolveAttachmentMediaUrl(active.id);
    if (!url) {
      return;
    }
    await openAttachmentExternally(url);
  };

  if (!visible || !active) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={[styles.backdrop, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeLabel}>Close</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {active.filename ?? 'Attachment'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {isImageMimeType(active.content_type) ? (
          <View style={styles.imageStage}>
            {isLoading || !source ? (
              <ActivityIndicator color={tavColors.white} size="large" />
            ) : (
              <Image contentFit="contain" source={source} style={{ width: width - 24, height: '100%' }} />
            )}
          </View>
        ) : (
          <View style={styles.fileStage}>
            <Text style={styles.fileIcon}>📎</Text>
            <Text style={styles.fileTitle}>{active.filename ?? 'Attachment'}</Text>
            <Text style={styles.fileMeta}>{active.content_type ?? 'Media file'}</Text>
            <Pressable onPress={() => void openExternal()} style={styles.openButton}>
              <Text style={styles.openLabel}>Open attachment</Text>
            </Pressable>
          </View>
        )}

        {attachments.length > 1 ? (
          <ScrollView horizontal contentContainerStyle={styles.thumbRow} showsHorizontalScrollIndicator={false}>
            {attachments.map((attachment, attachmentIndex) => (
              <Pressable
                key={attachment.id}
                onPress={() => setIndex(attachmentIndex)}
                style={[styles.thumbChip, attachmentIndex === index && styles.thumbChipActive]}>
                <Text
                  style={[
                    styles.thumbChipLabel,
                    attachmentIndex === index && styles.thumbChipLabelActive,
                  ]}>
                  {attachmentIndex + 1}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.96)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    minWidth: 64,
  },
  closeLabel: {
    color: tavColors.blue,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: tavColors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  headerSpacer: {
    minWidth: 64,
  },
  imageStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fileStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  fileIcon: {
    fontSize: 42,
  },
  fileTitle: {
    color: tavColors.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  fileMeta: {
    color: tavColors.zinc400,
    fontSize: 14,
    textAlign: 'center',
  },
  openButton: {
    marginTop: 8,
    backgroundColor: tavColors.blue,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  openLabel: {
    color: tavColors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  thumbRow: {
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  thumbChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: tavColors.zinc600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbChipActive: {
    backgroundColor: tavColors.white,
    borderColor: tavColors.white,
  },
  thumbChipLabel: {
    color: tavColors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  thumbChipLabelActive: {
    color: tavColors.zinc900,
  },
});
