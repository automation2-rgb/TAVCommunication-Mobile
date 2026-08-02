import { Phone } from '@/components/icons/lucide';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useVoiceClient } from '@/contexts/voice-client';
import { getMicrophoneDeniedMessage } from '@/lib/voice/microphone-permission';
import { pressScaleStyle, tavColors } from '@/lib/theme';

type ThreadVoiceCallControlsProps = {
  disabled?: boolean;
  onCall: () => Promise<void>;
};

export function ThreadVoiceCallControls({ disabled = false, onCall }: ThreadVoiceCallControlsProps) {
  const { phase, errorMessage, micAccess, isBusy } = useVoiceClient();

  const isDisabled =
    disabled ||
    isBusy ||
    phase === 'initializing' ||
    micAccess === 'unsupported' ||
    micAccess === 'denied';

  const handlePress = () => {
    if (isDisabled) {
      if (micAccess === 'denied') {
        Alert.alert('Microphone required', getMicrophoneDeniedMessage());
      }
      return;
    }

    void onCall().catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to start call.';
      Alert.alert('Call failed', message);
    });
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Call customer"
        disabled={isDisabled}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.callButton,
          isDisabled && styles.callButtonDisabled,
          !isDisabled && pressed && styles.callButtonPressed,
          pressScaleStyle(pressed),
        ]}>
        {phase === 'initializing' ? (
          <ActivityIndicator color={tavColors.zinc600} size="small" />
        ) : (
          <Phone color={tavColors.zinc600} size={18} strokeWidth={2.2} />
        )}
      </Pressable>
      {errorMessage && !isBusy ? (
        <Text style={styles.error} numberOfLines={2}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  callButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: tavColors.white,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  callButtonPressed: {
    backgroundColor: tavColors.emerald50,
    borderColor: '#a7f3d0',
  },
  callButtonDisabled: {
    opacity: 0.45,
  },
  error: {
    fontSize: 11,
    color: tavColors.red600,
    textAlign: 'center',
    maxWidth: 72,
  },
});
