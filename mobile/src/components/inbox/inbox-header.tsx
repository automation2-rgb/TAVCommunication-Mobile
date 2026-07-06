import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tavColors, tavLayout } from '@/lib/theme';

type InboxHeaderProps = {
  inboxName: string;
  onOpenInboxSwitcher: () => void;
  onOpenUserMenu: () => void;
  onCompose?: () => void;
};

export function InboxHeader({ inboxName, onOpenInboxSwitcher, onOpenUserMenu, onCompose }: InboxHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" onPress={onOpenInboxSwitcher} style={styles.inboxButton}>
        <Text style={styles.inboxName} numberOfLines={1}>
          {inboxName}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <View style={styles.actions}>
        {onCompose ? (
          <Pressable accessibilityRole="button" onPress={onCompose} style={styles.iconButton}>
            <Text style={styles.iconLabel}>✎</Text>
          </Pressable>
        ) : null}
        <Pressable accessibilityRole="button" disabled style={[styles.iconButton, styles.iconDisabled]}>
          <Text style={styles.iconLabel}>⌕</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenUserMenu} style={styles.iconButton}>
          <Text style={styles.iconLabel}>☰</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    minHeight: tavLayout.headerHeight,
  },
  inboxButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingRight: 8,
  },
  inboxName: {
    fontSize: 18,
    fontWeight: '600',
    color: tavColors.zinc900,
    flexShrink: 1,
  },
  chevron: {
    fontSize: 14,
    color: tavColors.zinc500,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: tavLayout.iconButtonSize,
    height: tavLayout.iconButtonSize,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: {
    opacity: 0.35,
  },
  iconLabel: {
    fontSize: 18,
    color: tavColors.zinc700,
  },
});

export function InboxHeaderSpinner() {
  return <ActivityIndicator color={tavColors.blue} />;
}
