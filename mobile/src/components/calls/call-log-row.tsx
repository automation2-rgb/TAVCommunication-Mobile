import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  PhoneMissed,
  type LucideIcon,
} from '@/components/icons/lucide';
import { formatCallListTimestamp } from '@/lib/format-time';
import { getCallContactLabel, getCallDirectionLabel } from '@/lib/voice/call-contact-label';
import { isMissedInboundStatus } from '@/lib/voice/call-log-status';
import { pressScaleStyle, tavColors } from '@/lib/theme';
import type { CallLog } from '@/types/voice';

type CallLogRowProps = {
  call: CallLog;
  onPressInfo: (call: CallLog) => void;
  onPressCall?: (call: CallLog) => void;
};

function DirectionIcon({ missed, direction }: { missed: boolean; direction: CallLog['direction'] }) {
  let Icon: LucideIcon = direction === 'inbound' ? ArrowDownLeft : ArrowUpRight;
  if (missed) {
    Icon = PhoneMissed;
  }

  const color = missed ? tavColors.red600 : tavColors.zinc500;

  return <Icon color={color} size={14} strokeWidth={2.4} />;
}

export const CallLogRow = memo(function CallLogRow({
  call,
  onPressInfo,
  onPressCall,
}: CallLogRowProps) {
  const missed = call.direction === 'inbound' && isMissedInboundStatus(call.status);
  const contactLabel = getCallContactLabel(call);
  const directionLabel = getCallDirectionLabel(call, missed);

  return (
    <Pressable
      accessibilityRole="button"
      delayPressIn={100}
      disabled={!onPressCall}
      onPress={() => onPressCall?.(call)}
      style={({ pressed }) => [styles.row, pressed && onPressCall && styles.rowPressed]}>
      <ContactAvatar displayName={contactLabel} phoneE164={call.customer_e164} size="lg" />

      <View style={styles.content}>
        <Text style={[styles.name, missed && styles.nameMissed]} numberOfLines={1}>
          {contactLabel}
        </Text>
        <View style={styles.statusRow}>
          <DirectionIcon missed={missed} direction={call.direction} />
          <Text style={[styles.statusText, missed && styles.statusMissed]}>{directionLabel}</Text>
        </View>
      </View>

      <View style={styles.trailing}>
        <Text style={styles.timestamp}>{formatCallListTimestamp(call.started_at)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Call details"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onPressInfo(call);
          }}
          style={({ pressed }) => [styles.infoButton, pressScaleStyle(pressed)]}>
          <Info color={tavColors.blue} size={22} strokeWidth={2.2} />
        </Pressable>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc100,
  },
  rowPressed: {
    backgroundColor: tavColors.zinc50,
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  nameMissed: {
    color: tavColors.red600,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    color: tavColors.zinc500,
  },
  statusMissed: {
    color: tavColors.red600,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 8,
  },
  timestamp: {
    fontSize: 14,
    color: tavColors.zinc500,
  },
  infoButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
