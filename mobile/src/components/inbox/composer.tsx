import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tavColors, tavLayout } from '@/lib/theme';

const BODY_MAX = 1600;

type ComposerProps = {
  disabled?: boolean;
  disabledReason?: string;
  isSending?: boolean;
  onSend: (body: string) => Promise<void>;
};

export function Composer({ disabled = false, disabledReason, isSending = false, onSend }: ComposerProps) {
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState('');

  const trimmed = body.trim();
  const canSend = !disabled && !isSending && trimmed.length > 0;

  const handleSend = async () => {
    if (!canSend) {
      return;
    }

    const nextBody = trimmed;
    setBody('');
    await onSend(nextBody);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {disabled && disabledReason ? <Text style={styles.disabledHint}>{disabledReason}</Text> : null}
      <View style={styles.slab}>
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
    gap: 6,
  },
  disabledHint: {
    fontSize: 12,
    color: tavColors.zinc500,
    paddingHorizontal: 4,
  },
  slab: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: tavColors.white,
    borderRadius: tavLayout.composerRadius,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
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
});
