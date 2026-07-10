import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useComposerAttachments } from '@/hooks/use-composer-attachments';
import type { ComposerFile } from '@/lib/messaging/mms-policy';
import { isImageMimeType } from '@/lib/messaging/mms-policy';
import { tavColors, tavLayout } from '@/lib/theme';

const BODY_MAX = 1600;

export type ComposerSendPayload = {
  body: string;
  files: ComposerFile[];
};

type ComposerProps = {
  disabled?: boolean;
  disabledReason?: string;
  isSending?: boolean;
  onSend: (payload: ComposerSendPayload) => Promise<void>;
};

export function Composer({ disabled = false, disabledReason, isSending = false, onSend }: ComposerProps) {
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('');
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const { files, removeFile, clearFiles, pickFromLibrary, pickFromCamera } = useComposerAttachments();

  const trimmed = body.trim();
  const canSend = !disabled && !isSending && (trimmed.length > 0 || files.length > 0);

  const handleSend = async () => {
    if (!canSend) {
      return;
    }

    const nextBody = trimmed;
    const nextFiles = files;

    try {
      await onSend({ body: nextBody, files: nextFiles });
      setBody('');
      clearFiles();
    } catch {
      // Parent surfaces the error; keep draft + attachments for retry.
    }
  };

  const runPicker = (picker: () => Promise<void>) => {
    setAttachMenuOpen(false);
    // Android needs the menu fully dismissed before launching the system picker.
    setTimeout(() => {
      void picker();
    }, 300);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {disabled && disabledReason ? <Text style={styles.disabledHint}>{disabledReason}</Text> : null}

      {files.length > 0 ? (
        <ScrollView horizontal contentContainerStyle={styles.previewRow} showsHorizontalScrollIndicator={false}>
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.previewTile}>
              {isImageMimeType(file.type) ? (
                <Image contentFit="cover" source={{ uri: file.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewFile}>
                  <Text style={styles.previewFileIcon}>📎</Text>
                  <Text numberOfLines={2} style={styles.previewFileLabel}>
                    {file.name}
                  </Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                disabled={isSending}
                onPress={() => removeFile(index)}
                style={styles.removeButton}>
                <Text style={styles.removeLabel}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.slab}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled || isSending}
          onPress={() => setAttachMenuOpen(true)}
          style={[styles.attachButton, (disabled || isSending) && styles.attachButtonDisabled]}>
          <Text style={styles.attachLabel}>＋</Text>
        </Pressable>
        <TextInput
          editable={!disabled && !isSending}
          multiline
          maxLength={BODY_MAX}
          placeholder="Message"
          placeholderTextColor={tavColors.zinc500}
          style={styles.input}
          value={body}
          onChangeText={setBody}
        />
        <Pressable
          accessibilityRole="button"
          disabled={!canSend}
          onPress={() => {
            void handleSend();
          }}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
          {isSending ? (
            <ActivityIndicator color={tavColors.white} />
          ) : (
            <Text style={styles.sendLabel}>↑</Text>
          )}
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setAttachMenuOpen(false)}
        transparent
        visible={attachMenuOpen}>
        <Pressable style={styles.menuBackdrop} onPress={() => setAttachMenuOpen(false)}>
          <View style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Text style={styles.menuTitle}>Add attachment</Text>
            <Pressable
              style={styles.menuButton}
              onPress={() => {
                runPicker(pickFromLibrary);
              }}>
              <Text style={styles.menuButtonLabel}>Photo library</Text>
            </Pressable>
            <Pressable
              style={styles.menuButton}
              onPress={() => {
                runPicker(pickFromCamera);
              }}>
              <Text style={styles.menuButtonLabel}>Camera</Text>
            </Pressable>
            <Pressable style={styles.menuCancel} onPress={() => setAttachMenuOpen(false)}>
              <Text style={styles.menuCancelLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tavColors.composerSlab,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tavColors.zinc200,
    paddingTop: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  disabledHint: {
    fontSize: 12,
    color: tavColors.zinc500,
    paddingHorizontal: 4,
  },
  previewRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  previewTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: tavColors.white,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  previewFileIcon: {
    fontSize: 18,
  },
  previewFileLabel: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    color: tavColors.zinc600,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    color: tavColors.white,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  slab: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: tavColors.white,
    borderRadius: tavLayout.composerRadius,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc100,
    marginBottom: 2,
  },
  attachButtonDisabled: {
    opacity: 0.45,
  },
  attachLabel: {
    fontSize: 22,
    lineHeight: 24,
    color: tavColors.zinc700,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 120,
    fontSize: 16,
    lineHeight: 22,
    color: tavColors.zinc900,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: tavLayout.sendButtonSize,
    height: tavLayout.sendButtonSize,
    borderRadius: tavLayout.sendButtonSize / 2,
    backgroundColor: tavColors.bubbleOut,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  sendLabel: {
    color: tavColors.white,
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(9, 9, 11, 0.45)',
  },
  menuSheet: {
    backgroundColor: tavColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
    marginBottom: 4,
  },
  menuButton: {
    borderRadius: 12,
    backgroundColor: tavColors.zinc100,
    paddingVertical: 14,
    alignItems: 'center',
  },
  menuButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  menuCancel: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  menuCancelLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.blue,
  },
});
