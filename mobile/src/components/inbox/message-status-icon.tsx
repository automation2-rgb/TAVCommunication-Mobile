import { StyleSheet, Text, View } from 'react-native';

import { tavColors } from '@/lib/theme';
import type { MessageStatus } from '@/types/messaging';

type MessageStatusIconProps = {
  status: MessageStatus | string;
};

export function MessageStatusIcon({ status }: MessageStatusIconProps) {
  const normalized = String(status).toLowerCase();
  let glyph = '◔';
  let color = 'rgba(255,255,255,0.72)';

  if (normalized === 'sending' || normalized === 'queued') {
    glyph = '◔';
  } else if (normalized === 'sent') {
    glyph = '✓';
  } else if (normalized === 'delivered') {
    glyph = '✓✓';
  } else if (normalized === 'failed' || normalized === 'undelivered') {
    glyph = '!';
    color = '#fecaca';
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.glyph, { color }]}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginLeft: 4,
  },
  glyph: {
    fontSize: 11,
    fontWeight: '700',
  },
});
