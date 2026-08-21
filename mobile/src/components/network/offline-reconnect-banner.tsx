import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStatus } from '@/contexts/network-status';
import { tavColors } from '@/lib/theme';

export function OfflineReconnectBanner() {
  const insets = useSafeAreaInsets();
  const { isOffline, isReady } = useNetworkStatus();

  if (!isReady || !isOffline) {
    return null;
  }

  return (
    <View
      accessibilityHint="Messages will send when connection returns"
      accessibilityLabel="Offline"
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      pointerEvents="none"
      style={[styles.host, { top: insets.top + 6 }]}>
      <View style={styles.pill}>
        <View style={styles.dot} />
        <Text style={styles.label}>Offline</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 95,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tavColors.zinc400,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: tavColors.white,
  },
});
