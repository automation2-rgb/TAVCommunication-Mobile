import { ChevronDown, Plus, Search } from '@/components/icons/lucide';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/avatars/user-avatar';
import { pressScaleStyle, tavColors, tavLayout, tavShadows } from '@/lib/theme';

type InboxHeaderProps = {
  inboxName: string;
  inboxUnreadCount?: number;
  userDisplayName?: string | null;
  userEmail?: string | null;
  onOpenInboxSwitcher: () => void;
  onOpenUserMenu: () => void;
  onCompose?: () => void;
};

export function InboxHeader({
  inboxName,
  inboxUnreadCount = 0,
  userDisplayName,
  userEmail,
  onOpenInboxSwitcher,
  onOpenUserMenu,
  onCompose,
}: InboxHeaderProps) {
  const insets = useSafeAreaInsets();
  const badgeLabel = inboxUnreadCount > 99 ? '99+' : String(inboxUnreadCount);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenInboxSwitcher}
        style={({ pressed }) => [styles.inboxButton, pressScaleStyle(pressed)]}>
        <Text style={styles.inboxName} numberOfLines={1}>
          {inboxName}
        </Text>
        {inboxUnreadCount > 0 ? (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadPillText}>{badgeLabel}</Text>
          </View>
        ) : null}
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
        <Pressable
          accessibilityRole="button"
          onPress={onOpenUserMenu}
          style={({ pressed }) => [styles.userMenuButton, pressScaleStyle(pressed)]}>
          <UserAvatar displayName={userDisplayName} email={userEmail} size={tavLayout.userAvatar} />
          <ChevronDown color={tavColors.zinc500} size={14} strokeWidth={2.2} />
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
  unreadPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: tavColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: tavColors.white,
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
  userMenuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 4,
    paddingRight: 2,
    paddingVertical: 4,
    borderRadius: 999,
  },
});

export function InboxHeaderSpinner() {
  return <ActivityIndicator color={tavColors.blue} />;
}
