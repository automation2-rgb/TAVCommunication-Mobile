import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { getAttachmentImageSource } from '@/lib/messaging/attachment-url';
import { isImageMimeType } from '@/lib/messaging/mms-policy';
import { tavColors } from '@/lib/theme';
import type { MessageAttachment } from '@/types/messaging';

type AttachmentThumbnailProps = {
  attachment: MessageAttachment;
  outbound?: boolean;
  onPress: () => void;
};

export function AttachmentThumbnail({ attachment, outbound = false, onPress }: AttachmentThumbnailProps) {
  const [source, setSource] = useState<{ uri: string; headers?: Record<string, string> } | null>(null);
  const [isLoading, setIsLoading] = useState(isImageMimeType(attachment.content_type));

  useEffect(() => {
    if (!isImageMimeType(attachment.content_type)) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    void getAttachmentImageSource(attachment.id).then((next) => {
      if (!cancelled) {
        setSource(next);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [attachment.content_type, attachment.id]);

  const label = attachment.filename?.trim() || 'Attachment';

  return (
    <Pressable onPress={onPress} style={[styles.tile, outbound && styles.tileOutbound]}>
      {isImageMimeType(attachment.content_type) ? (
        isLoading || !source ? (
          <View style={styles.imageFallback}>
            <ActivityIndicator color={outbound ? tavColors.white : tavColors.blue} />
          </View>
        ) : (
          <Image contentFit="cover" source={source} style={styles.image} />
        )
      ) : (
        <View style={styles.fileFallback}>
          <Text style={[styles.fileIcon, outbound && styles.fileIconOutbound]}>📎</Text>
          <Text numberOfLines={2} style={[styles.fileLabel, outbound && styles.fileLabelOutbound]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 132,
    height: 132,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: tavColors.zinc100,
  },
  tileOutbound: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileIconOutbound: {
    color: tavColors.white,
  },
  fileLabel: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    color: tavColors.zinc700,
  },
  fileLabelOutbound: {
    color: tavColors.white,
  },
});
