import { StyleSheet, Text, View } from 'react-native';

import { tavColors, tavShadows } from '@/lib/theme';

type UnreadCountBadgeProps = {
  count: number;
};

function formatUnreadLabel(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function UnreadCountBadge({ count }: UnreadCountBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const label = formatUnreadLabel(count);
  const isCompact = label.length === 1;

  return (
    <View style={[styles.badge, isCompact && styles.badgeCompact]}>
      <Text style={styles.label} allowFontScaling={false}>
        {label}
      </Text>
    </View>
  );
}

const BADGE_SIZE = 22;

const styles = StyleSheet.create({
  badge: {
    minWidth: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    paddingHorizontal: 7,
    backgroundColor: tavColors.blue,
    borderWidth: 2,
    borderColor: tavColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...tavShadows.sm,
  },
  badgeCompact: {
    width: BADGE_SIZE,
    paddingHorizontal: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: tavColors.white,
    lineHeight: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
