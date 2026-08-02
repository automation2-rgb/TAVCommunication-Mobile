import { Paperclip, Send, X } from '@/components/icons/lucide';
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
import { pressScaleStyle, tavColors, tavLayout, tavShadows, tavTypography } from '@/lib/theme';

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
  const [focused, setFocused] = useState(false);
  const { files, removeFile, clearFiles, pickFromLibrary, pickFromCamera } = useComposerAttachments();

  const trimmed = body.trim();
  const canSend = !disabled && !isSending && (trimmed.length > 0 || files.length > 0);
  const overLimit = body.length > BODY_MAX;
  const placeholder = files.length > 0 ? 'Caption (optional)…' : 'Type a message…';

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
                  <Paperclip color={tavColors.zinc600} size={18} strokeWidth={2} />
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
                <X color={tavColors.white} size={14} strokeWidth={2.5} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.slab, focused && styles.slabFocused]}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled || isSending}
          onPress={() => setAttachMenuOpen(true)}
          style={({ pressed }) => [
            styles.attachButton,
            (disabled || isSending) && styles.attachButtonDisabled,
            pressScaleStyle(pressed),
          ]}>
          <Paperclip color={tavColors.zinc600} size={20} strokeWidth={2.2} />
        </Pressable>

        <TextInput
          editable={!disabled && !isSending}
          multiline
          maxLength={BODY_MAX + 50}
          placeholder={placeholder}
          placeholderTextColor={tavColors.zinc400}
          style={styles.input}
          value={body}
          onChangeText={setBody}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        <Pressable
          accessibilityRole="button"
          disabled={!canSend}
          onPress={() => {
            void handleSend();
          }}
          style={({ pressed }) => [
            styles.sendButton,
            !canSend && styles.sendButtonDisabled,
            pressScaleStyle(pressed),
          ]}>
          {isSending ? (
            <ActivityIndicator color={tavColors.white} />
          ) : (
            <Send color={tavColors.white} size={18} strokeWidth={2.4} />
          )}
        </Pressable>
      </View>

      {!disabled ? (
        <View style={styles.footerRow}>
          <Text style={styles.hintText}>Send button to send · Enter for new line</Text>
          {body.length > 0 ? (
            <Text style={[styles.counter, overLimit && styles.counterOver]}>{body.length}/{BODY_MAX}</Text>
          ) : null}
        </View>
      ) : null}

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
    borderTopColor: 'rgba(228, 228, 231, 0.8)',
    paddingTop: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  disabledHint: {
    fontSize: 14,
    color: tavColors.zinc500,
    textAlign: 'center',
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
    backgroundColor: tavColors.zinc50,
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
  slab: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    backgroundColor: tavColors.white,
    borderRadius: tavLayout.composerRadius,
    borderWidth: 1,
    borderColor: 'rgba(228, 228, 231, 0.9)',
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
    ...tavShadows.sm,
  },
  slabFocused: {
    borderColor: tavColors.zinc300,
    ...tavShadows.md,
  },
  attachButton: {
    width: tavLayout.iconButtonSize,
    height: tavLayout.iconButtonSize,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  attachButtonDisabled: {
    opacity: 0.45,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    ...tavTypography.composerInput,
    color: tavColors.zinc900,
    paddingTop: 12,
    paddingBottom: 12,
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
    backgroundColor: tavColors.zinc300,
    opacity: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    color: tavColors.zinc400,
    flex: 1,
  },
  counter: {
    fontSize: 12,
    color: tavColors.zinc400,
  },
  counterOver: {
    color: tavColors.red600,
    fontWeight: '600',
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuSheet: {
    backgroundColor: tavColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
    ...tavShadows.lg,
  },
  menuTitle: {
    fontSize: 18,
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
