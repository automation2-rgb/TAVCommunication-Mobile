import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVoiceClient } from '@/contexts/voice-client';
import { tavColors } from '@/lib/theme';

type InCallOverlayProps = {
  contactLabel: string;
};

export function InCallOverlay({ contactLabel }: InCallOverlayProps) {
  const insets = useSafeAreaInsets();
  const { phase, elapsedLabel, isMuted, hangUp, toggleMute } = useVoiceClient();

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
            {contactLabel}
          </Text>
          <Text style={styles.status}>{statusLabel}</Text>

          <View style={styles.controls}>
            <Pressable accessibilityRole="button" onPress={() => void toggleMute()} style={styles.controlButton}>
              <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => void hangUp()}
              style={[styles.controlButton, styles.hangUpButton]}>
              <Text style={styles.hangUpLabel}>Hang up</Text>
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
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: tavColors.emerald50,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  contact: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  status: {
    fontSize: 24,
    fontWeight: '600',
    color: tavColors.emerald600,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  controlButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: tavColors.zinc100,
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: tavColors.zinc700,
  },
  hangUpButton: {
    backgroundColor: tavColors.red600,
  },
  hangUpLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: tavColors.white,
  },
});
