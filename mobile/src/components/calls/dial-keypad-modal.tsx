import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Delete, Phone, X } from '@/components/icons/lucide';
import { VoiceInboxPickerSheet } from '@/components/calls/voice-inbox-picker-sheet';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useVoiceClientActions } from '@/contexts/voice-client';
import {
  formatUsNationalDisplay,
  isCompleteUsNationalNumber,
  normalizeUsNationalDigits,
  toUsE164,
} from '@/lib/phone/us-keypad';
import { placeVoiceCallToNumber } from '@/lib/voice/place-voice-call';
import { getVoiceEnabledInboxes } from '@/lib/voice/voice-inboxes';
import { pressScaleStyle, tavColors } from '@/lib/theme';

type DialKeypadModalProps = {
  visible: boolean;
  onClose: () => void;
};

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

type KeypadKeyProps = {
  label: string;
  sublabel?: string;
  onPress: () => void;
  onLongPress?: () => void;
};

function KeypadKey({ label, sublabel, onPress, onLongPress }: KeypadKeyProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
      <Text style={styles.keyLabel}>{label}</Text>
      {sublabel ? <Text style={styles.keySublabel}>{sublabel}</Text> : null}
    </Pressable>
  );
}

const LETTER_HINTS: Record<string, string> = {
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
};

export function DialKeypadModal({ visible, onClose }: DialKeypadModalProps) {
  const insets = useSafeAreaInsets();
  const { inboxes } = useInboxWorkspace();
  const { ensureReady, placeOutboundCall } = useVoiceClientActions();
  const [nationalDigits, setNationalDigits] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [inboxPickerOpen, setInboxPickerOpen] = useState(false);
  const [pendingE164, setPendingE164] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const voiceInboxes = useMemo(() => getVoiceEnabledInboxes(inboxes), [inboxes]);
  const displayNumber = formatUsNationalDisplay(nationalDigits);
  const canCall = isCompleteUsNationalNumber(nationalDigits);

  const resetState = useCallback(() => {
    setNationalDigits('');
    setPendingE164(null);
    setPendingLabel(null);
    setInboxPickerOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isCalling) {
      return;
    }
    resetState();
    onClose();
  }, [isCalling, onClose, resetState]);

  const appendDigit = (digit: string) => {
    setNationalDigits((current) => normalizeUsNationalDigits(current + digit));
  };

  const deleteDigit = () => {
    setNationalDigits((current) => current.slice(0, -1));
  };

  const startCallWithInbox = async (inboxId: string, phoneE164: string, contactLabel: string) => {
    setIsCalling(true);
    try {
      await placeVoiceCallToNumber({
        inboxId,
        phoneE164,
        contactLabel,
        ensureReady,
        placeOutboundCall,
      });
      resetState();
      onClose();
    } catch (error) {
      Alert.alert(
        'Unable to place call',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsCalling(false);
      setPendingE164(null);
      setPendingLabel(null);
    }
  };

  const handleCallPress = () => {
    if (!canCall || isCalling) {
      return;
    }

    if (voiceInboxes.length === 0) {
      Alert.alert('Voice unavailable', 'No voice-enabled inbox is assigned to your account.');
      return;
    }

    let phoneE164: string;
    try {
      phoneE164 = toUsE164(nationalDigits);
    } catch (error) {
      Alert.alert('Invalid number', error instanceof Error ? error.message : 'Enter a valid number.');
      return;
    }

    const contactLabel = formatUsNationalDisplay(nationalDigits);

    if (voiceInboxes.length === 1) {
      void startCallWithInbox(voiceInboxes[0]!.id, phoneE164, contactLabel);
      return;
    }

    setPendingE164(phoneE164);
    setPendingLabel(contactLabel);
    setInboxPickerOpen(true);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close keypad"
              disabled={isCalling}
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressScaleStyle(pressed)]}>
              <X color={tavColors.zinc700} size={24} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.displayRow}>
            <Text style={[styles.displayNumber, !displayNumber && styles.displayPlaceholder]} numberOfLines={1}>
              {displayNumber || 'Enter number'}
            </Text>
            {nationalDigits.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete digit"
                disabled={isCalling}
                onPress={deleteDigit}
                style={({ pressed }) => [styles.deleteButton, pressScaleStyle(pressed)]}>
                <Delete color={tavColors.zinc600} size={22} strokeWidth={2.2} />
              </Pressable>
            ) : (
              <View style={styles.deleteSpacer} />
            )}
          </View>

          <Text style={styles.countryHint}>US numbers · +1 added automatically</Text>

          <View style={styles.keypad}>
            {KEYPAD_ROWS.map((row) => (
              <View key={row.join('-')} style={styles.keyRow}>
                {row.map((digit) => (
                  <KeypadKey
                    key={digit}
                    label={digit}
                    sublabel={LETTER_HINTS[digit]}
                    onPress={() => appendDigit(digit)}
                  />
                ))}
              </View>
            ))}
            <View style={styles.keyRow}>
              <View style={styles.keySpacer} />
              <KeypadKey label="0" onPress={() => appendDigit('0')} onLongPress={() => appendDigit('0')} />
              <View style={styles.keySpacer} />
            </View>
          </View>

          <View style={styles.callRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Place call"
              disabled={!canCall || isCalling}
              onPress={handleCallPress}
              style={({ pressed }) => [
                styles.callButton,
                (!canCall || isCalling) && styles.callButtonDisabled,
                pressed && canCall && !isCalling && pressScaleStyle(pressed),
              ]}>
              {isCalling ? (
                <ActivityIndicator color={tavColors.white} />
              ) : (
                <Phone color={tavColors.white} size={28} strokeWidth={2.4} />
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <VoiceInboxPickerSheet
        visible={inboxPickerOpen}
        inboxes={voiceInboxes}
        onClose={() => {
          setInboxPickerOpen(false);
          setPendingE164(null);
          setPendingLabel(null);
        }}
        onSelect={(inboxId) => {
          if (!pendingE164) {
            return;
          }
          void startCallWithInbox(inboxId, pendingE164, pendingLabel ?? pendingE164);
        }}
      />
    </>
  );
}

const KEY_SIZE = 76;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tavColors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc100,
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minHeight: 56,
    gap: 12,
  },
  displayNumber: {
    flex: 1,
    fontSize: 34,
    fontWeight: '300',
    color: tavColors.zinc900,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  displayPlaceholder: {
    color: tavColors.zinc400,
    fontSize: 28,
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteSpacer: {
    width: 40,
  },
  countryHint: {
    textAlign: 'center',
    fontSize: 13,
    color: tavColors.zinc500,
    marginBottom: 12,
  },
  keypad: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  key: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc100,
  },
  keyPressed: {
    backgroundColor: tavColors.zinc200,
  },
  keySpacer: {
    width: KEY_SIZE,
    height: KEY_SIZE,
  },
  keyLabel: {
    fontSize: 28,
    fontWeight: '400',
    color: tavColors.zinc900,
  },
  keySublabel: {
    fontSize: 10,
    fontWeight: '600',
    color: tavColors.zinc500,
    letterSpacing: 1,
    marginTop: -2,
  },
  callRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  callButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.green600,
  },
  callButtonDisabled: {
    backgroundColor: tavColors.zinc300,
  },
});
