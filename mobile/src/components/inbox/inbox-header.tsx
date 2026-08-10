import { ChevronDown, Plus, Search } from '@/components/icons/lucide';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UnreadCountBadge } from '@/components/inbox/unread-count-badge';
import { pressScaleStyle, tavColors, tavLayout } from '@/lib/theme';
type InboxHeaderProps = {
  inboxName: string;
  inboxUnreadCount?: number;
  onOpenInboxSwitcher: () => void;
  onCompose?: () => void;
};

export function InboxHeader({
  inboxName,
  inboxUnreadCount = 0,
  onOpenInboxSwitcher,
  onCompose,
}: InboxHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenInboxSwitcher}
        style={({ pressed }) => [styles.inboxButton, pressScaleStyle(pressed)]}>
        <Text style={styles.inboxName} numberOfLines={1}>
          {inboxName}
        </Text>
        <UnreadCountBadge count={inboxUnreadCount} />
        <ChevronDown color={tavColors.zinc500} size={18} strokeWidth={2.2} />
      </Pressable>

      <View style={styles.actions}>
        {onCompose ? (
          <Pressable
            accessibilityRole="button"
            onPress={onCompose}
            style={({ pressed }) => [styles.iconButton, pressScaleStyle(pressed)]}>
            <Plus color={tavColors.zinc600} size={20} strokeWidth={2.2} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled
          style={[styles.iconButton, styles.iconDisabled]}>
          <Search color={tavColors.zinc600} size={20} strokeWidth={2.2} />
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
    gap: 6,
    paddingVertical: 8,
    paddingRight: 8,
  },
  inboxName: {
    fontSize: 18,
    fontWeight: '600',
    color: tavColors.zinc900,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: tavLayout.iconButtonSize,
    height: tavLayout.iconButtonSize,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDisabled: {
    opacity: 0.35,
  },
});

export function InboxHeaderSpinner() {
  return <ActivityIndicator color={tavColors.blue} />;
}
