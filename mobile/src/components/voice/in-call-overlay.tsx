import { Href, useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { MessageSquare, Mic, MicOff, PhoneOff } from '@/components/icons/lucide';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useVoiceClient } from '@/contexts/voice-client';
import { pressScaleStyle, tavColors, tavLayout } from '@/lib/theme';

const CALL_BUTTON_SIZE = 72;

function CallControlButton({
  label,
  onPress,
  backgroundColor,
  icon,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  backgroundColor: string;
  icon: ReactNode;
  accessibilityLabel: string;
}) {
  return (
    <View style={styles.controlColumn}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [styles.controlButton, { backgroundColor }, pressScaleStyle(pressed)]}>
        {icon}
      </Pressable>
      <Text style={styles.controlLabel}>{label}</Text>
    </View>
  );
}

function CallStatusBanner() {
  const insets = useSafeAreaInsets();
  const {
    phase,
    elapsedLabel,
    activeContactLabel,
    activeCall,
    callOverlayVisible,
    showCallOverlay,
    hangUp,
  } = useVoiceClient();

  const isBusy = phase === 'connecting' || phase === 'in-call';
  if (!isBusy || callOverlayVisible) {
    return null;
  }

  const statusLabel = phase === 'connecting' ? 'Calling…' : elapsedLabel;
  const title = activeContactLabel ?? activeCall?.contactLabel ?? 'On call';

  return (
    <View pointerEvents="box-none" style={[styles.bannerHost, { top: insets.top }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Return to call screen"
        onPress={showCallOverlay}
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}>
        <View style={styles.bannerPulse} />
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.bannerStatus}>{statusLabel}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hang up"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation?.();
            void hangUp();
          }}
          style={({ pressed }) => [styles.bannerHangUp, pressScaleStyle(pressed)]}>
          <PhoneOff color={tavColors.white} size={18} strokeWidth={2.4} />
        </Pressable>
      </Pressable>
    </View>
  );
}

function InCallFullScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setActiveInboxId } = useInboxWorkspace();
  const {
    phase,
    elapsedLabel,
    isMuted,
    hangUp,
    toggleMute,
    activeContactLabel,
    activeCall,
    callOverlayVisible,
    dismissCallOverlay,
  } = useVoiceClient();

  const isBusy = phase === 'connecting' || phase === 'in-call';
  if (!isBusy || !callOverlayVisible) {
    return null;
  }

  const statusLabel = phase === 'connecting' ? 'Calling…' : elapsedLabel;
  const title = activeContactLabel ?? activeCall?.contactLabel ?? 'On call';
  const phoneE164 = activeCall?.customerE164 ?? null;
  const canReturnToConversation = Boolean(activeCall?.threadId);

  const handleReturnToConversation = () => {
    if (!activeCall) {
      dismissCallOverlay();
      return;
    }

    dismissCallOverlay();
    setActiveInboxId(activeCall.inboxId);
    router.push(`/(app)/inbox/${activeCall.threadId}` as Href);
  };

  return (
    <Modal animationType="slide" statusBarTranslucent visible={isBusy && callOverlayVisible}>
      <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.hero}>
          <ContactAvatar displayName={title} phoneE164={phoneE164} size="lg" />
          <Text style={styles.contactName} numberOfLines={2}>
            {title}
          </Text>
          {phoneE164 && phoneE164 !== title ? (
            <Text style={styles.contactPhone} numberOfLines={1}>
              {phoneE164}
            </Text>
          ) : null}
          <Text style={styles.status}>{statusLabel}</Text>
        </View>

        <View style={styles.controlsRow}>
          <CallControlButton
            accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            backgroundColor={isMuted ? tavColors.white : 'rgba(255,255,255,0.16)'}
            icon={
              isMuted ? (
                <MicOff color={tavColors.zinc900} size={28} strokeWidth={2.2} />
              ) : (
                <Mic color={tavColors.white} size={28} strokeWidth={2.2} />
              )
            }
            label={isMuted ? 'Unmute' : 'Mute'}
            onPress={() => {
              void toggleMute();
            }}
          />
          <CallControlButton
            accessibilityLabel="Hang up"
            backgroundColor={tavColors.red600}
            icon={<PhoneOff color={tavColors.white} size={28} strokeWidth={2.4} />}
            label="End"
            onPress={() => {
              void hangUp();
            }}
          />
        </View>

        {canReturnToConversation ? (
          <Pressable
            accessibilityRole="button"
            onPress={handleReturnToConversation}
            style={({ pressed }) => [styles.returnButton, pressScaleStyle(pressed)]}>
            <MessageSquare color={tavColors.white} size={18} strokeWidth={2.2} />
            <Text style={styles.returnLabel}>Return to conversation</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

export function InCallOverlay() {
  return (
    <>
      <View pointerEvents="box-none" style={styles.overlayHost}>
        <CallStatusBanner />
      </View>
      <InCallFullScreen />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tavColors.zinc950,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  contactName: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '700',
    color: tavColors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  contactPhone: {
    fontSize: 16,
    color: tavColors.zinc400,
    textAlign: 'center',
  },
  status: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '500',
    color: tavColors.emerald500,
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 48,
    paddingVertical: 24,
  },
  controlColumn: {
    alignItems: 'center',
    gap: 10,
  },
  controlButton: {
    width: CALL_BUTTON_SIZE,
    height: CALL_BUTTON_SIZE,
    borderRadius: CALL_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.zinc300,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  returnLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.white,
  },
  overlayHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  bannerHost: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    zIndex: 1,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: tavColors.emerald600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerPressed: {
    opacity: 0.92,
  },
  bannerPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tavColors.emerald100,
  },
  bannerContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: tavColors.white,
  },
  bannerStatus: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  bannerHangUp: {
    width: tavLayout.iconButtonSize,
    height: tavLayout.iconButtonSize,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});
