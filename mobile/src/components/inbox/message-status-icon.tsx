import { AlertCircle, Check, CheckCheck, Clock, X } from '@/components/icons/lucide';
import { StyleSheet, View } from 'react-native';

import { tavColors } from '@/lib/theme';
import type { MessageStatus } from '@/types/messaging';

type MessageStatusIconProps = {
  status: MessageStatus | string;
  outbound?: boolean;
};

const ICON_SIZE = 14;

export function MessageStatusIcon({ status, outbound = true }: MessageStatusIconProps) {
  const normalized = String(status).toLowerCase();

  if (normalized === 'delivered') {
    return (
      <View style={styles.wrap}>
        <CheckCheck color={outbound ? tavColors.white : tavColors.green500} size={ICON_SIZE} strokeWidth={2.4} />
      </View>
    );
  }

  if (normalized === 'sent') {
    return (
      <View style={styles.wrap}>
        <Check color={outbound ? tavColors.white : tavColors.green500} size={ICON_SIZE} strokeWidth={2.4} />
      </View>
    );
  }

  if (normalized === 'sending' || normalized === 'queued') {
    return (
      <View style={styles.wrap}>
        <Clock color={outbound ? tavColors.bubbleOutDim : tavColors.amber500} size={ICON_SIZE} strokeWidth={2.4} />
      </View>
    );
  }

  if (normalized === 'failed' || normalized === 'undelivered') {
    return (
      <View style={styles.wrap}>
        <X color={outbound ? '#fecaca' : tavColors.red600} size={ICON_SIZE} strokeWidth={2.4} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <AlertCircle color={outbound ? tavColors.bubbleOutDim : tavColors.zinc400} size={ICON_SIZE} strokeWidth={2.4} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginLeft: 2,
  },
});
