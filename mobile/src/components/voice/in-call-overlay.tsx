import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVoiceClient } from '@/contexts/voice-client';
import { tavColors } from '@/lib/theme';

export function InCallOverlay() {
  const insets = useSafeAreaInsets();
  const { phase, elapsedLabel, isMuted, hangUp, toggleMute, activeContactLabel } = useVoiceClient();

  const visible = phase === 'connecting' || phase === 'in-call';
  if (!visible) {
    return null;
  }

  const statusLabel = phase === 'connecting' ? 'Calling…' : elapsedLabel;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={[styles.backdrop, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.card}>
          <Text style={styles.contact} numberOfLines={1}>
            {activeContactLabel ?? 'On call'}
          </Text>
          <Text style={styles.status}>{statusLabel}</Text>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => void toggleMute()} style={styles.actionButton}>
              <Text style={styles.actionLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void hangUp()}
              style={[styles.actionButton, styles.hangUpButton]}>
              <Text style={[styles.actionLabel, styles.hangUpLabel]}>Hang up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: tavColors.white,
    borderRadius: 20,
    padding: 24,
    gap: 8,
    alignItems: 'center',
  },
  contact: {
    fontSize: 20,
    fontWeight: '700',
    color: tavColors.zinc900,
  },
  status: {
    fontSize: 15,
    color: tavColors.zinc500,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: tavColors.zinc100,
    alignItems: 'center',
  },
  hangUpButton: {
    backgroundColor: tavColors.red600,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  hangUpLabel: {
    color: tavColors.white,
  },
});
