import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  callStatusColors,
  formatCallStatusLabel,
  isMissedInboundStatus,
} from '@/lib/voice/call-log-status';
import { formatCallDuration } from '@/lib/voice/format-voice';
import { formatRelativeTime } from '@/lib/format-time';
import { tavColors } from '@/lib/theme';
import type { CallLog } from '@/types/voice';

type CallLogRowProps = {
  call: CallLog;
};

export function CallLogRow({ call }: CallLogRowProps) {
  const router = useRouter();
  const statusStyle = callStatusColors(call.status, call.direction);
  const missed = call.direction === 'inbound' && isMissedInboundStatus(call.status);

  const openThread = () => {
    if (!call.thread_id) {
      return;
    }

    router.push(`/(app)/inbox/${call.thread_id}?inbox=${call.inbox_id}` as Href);
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!call.thread_id}
      onPress={openThread}
      style={[styles.card, missed && styles.missedCard]}>
      <View style={styles.topRow}>
        <Text style={styles.when}>{formatRelativeTime(call.started_at)}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {formatCallStatusLabel(call.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.inbox} numberOfLines={1}>
        {call.inbox_display_name ?? 'Inbox'}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Direction</Text>
        <Text style={styles.metaValue}>{call.direction === 'inbound' ? 'Inbound' : 'Outbound'}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Contact</Text>
        <Text style={styles.metaValue}>{call.customer_e164}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Agent</Text>
        <Text style={styles.metaValue}>{call.agent_display_name ?? '—'}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Duration</Text>
        <Text style={styles.metaValue}>{formatCallDuration(call.duration_seconds)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Thread</Text>
        <Text style={[styles.metaValue, call.thread_id ? styles.threadLink : styles.threadMuted]}>
          {call.thread_id ? 'Open conversation' : '—'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tavColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    padding: 14,
    gap: 6,
  },
  missedCard: {
    borderColor: tavColors.amber100,
    backgroundColor: 'rgba(255, 251, 235, 0.7)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  when: {
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.zinc700,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inbox: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaLabel: {
    fontSize: 13,
    color: tavColors.zinc500,
  },
  metaValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13,
    color: tavColors.zinc700,
  },
  threadLink: {
    color: tavColors.blue,
    fontWeight: '600',
  },
  threadMuted: {
    color: tavColors.zinc400,
  },
});
