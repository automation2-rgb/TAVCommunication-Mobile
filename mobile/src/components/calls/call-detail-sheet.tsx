import { Href, useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCallStatusLabel, isMissedInboundStatus } from '@/lib/voice/call-log-status';
import { getCallContactLabel } from '@/lib/voice/call-contact-label';
import { formatCallDuration } from '@/lib/voice/format-voice';
import { formatCallListTimestamp, formatMessageTime } from '@/lib/format-time';
import { formatE164AsUsDisplay } from '@/lib/phone/us-keypad';
import { pressScaleStyle, tavColors, tavShadows } from '@/lib/theme';
import type { CallLog } from '@/types/voice';

type CallDetailSheetProps = {
  call: CallLog | null;
  visible: boolean;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function CallDetailSheet({ call, visible, onClose }: CallDetailSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!call) {
    return null;
  }

  const missed = call.direction === 'inbound' && isMissedInboundStatus(call.status);
  const contactLabel = getCallContactLabel(call);

  const openThread = () => {
    if (!call.thread_id) {
      return;
    }

    onClose();
    router.push(`/(app)/inbox/${call.thread_id}?inbox=${call.inbox_id}` as Href);
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>{contactLabel}</Text>
        <Text style={styles.subtitle}>{formatE164AsUsDisplay(call.customer_e164)}</Text>

        <View style={styles.card}>
          <DetailRow label="When" value={`${formatCallListTimestamp(call.started_at)} · ${formatMessageTime(call.started_at)}`} />
          <DetailRow
            label="Direction"
            value={call.direction === 'inbound' ? (missed ? 'Missed inbound' : 'Inbound') : 'Outbound'}
          />
          <DetailRow label="Status" value={formatCallStatusLabel(call.status)} />
          <DetailRow label="Inbox" value={call.inbox_display_name ?? '—'} />
          <DetailRow label="Agent" value={call.agent_display_name ?? '—'} />
          <DetailRow label="Duration" value={formatCallDuration(call.duration_seconds)} />
        </View>

        {call.thread_id ? (
          <Pressable
            accessibilityRole="button"
            onPress={openThread}
            style={({ pressed }) => [styles.threadButton, pressScaleStyle(pressed)]}>
            <Text style={styles.threadButtonText}>Open conversation</Text>
          </Pressable>
        ) : null}

        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressScaleStyle(pressed)]}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: tavColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 16,
    gap: 12,
    ...tavShadows.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: tavColors.zinc900,
  },
  subtitle: {
    fontSize: 15,
    color: tavColors.zinc500,
    marginBottom: 4,
  },
  card: {
    backgroundColor: tavColors.zinc50,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    gap: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  detailLabel: {
    fontSize: 14,
    color: tavColors.zinc500,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  threadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.blue,
    borderRadius: 12,
    paddingVertical: 14,
  },
  threadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.white,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc600,
  },
});
