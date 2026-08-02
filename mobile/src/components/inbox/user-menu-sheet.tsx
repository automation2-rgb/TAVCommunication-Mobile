import { Href, useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatMissedBadgeCount, useMissedCalls } from '@/contexts/missed-calls';
import { signOut } from '@/lib/auth/sign-out';
import { pressScaleStyle, tavColors, tavShadows } from '@/lib/theme';

type UserMenuSheetProps = {
  visible: boolean;
  displayName?: string | null;
  onClose: () => void;
};

const MENU_ITEMS: Array<{ label: string; href: Href; showMissedBadge?: boolean }> = [
  { label: 'Calls', href: '/(app)/calls' as Href, showMissedBadge: true },
  { label: 'Contacts', href: '/(app)/contacts' as Href },
  { label: 'Profile', href: '/(app)/profile' as Href },
  { label: 'Settings', href: '/(app)/settings' as Href },
  { label: 'Help', href: '/(app)/help' as Href },
];

export function UserMenuSheet({ visible, displayName, onClose }: UserMenuSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unseenMissedCount } = useMissedCalls();
  const badgeLabel = formatMissedBadgeCount(unseenMissedCount);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { top: insets.top + 56, right: 12 }]}>
        {displayName ? <Text style={styles.userName}>{displayName}</Text> : null}
        {MENU_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              router.push(item.href);
            }}
            style={({ pressed }) => [styles.row, pressScaleStyle(pressed)]}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            {item.showMissedBadge && badgeLabel ? (
              <View style={styles.amberBadge}>
                <Text style={styles.amberBadgeText}>{badgeLabel}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            void signOut();
          }}
          style={({ pressed }) => [styles.row, styles.signOutRow, pressScaleStyle(pressed)]}>
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheet: {
    position: 'absolute',
    width: 224,
    backgroundColor: tavColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    paddingVertical: 8,
    ...tavShadows.lg,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.zinc900,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: tavColors.zinc800,
  },
  amberBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: tavColors.amber100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amberBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: tavColors.amber900,
  },
  signOutRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tavColors.zinc100,
    marginTop: 4,
  },
  signOutLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: tavColors.red600,
  },
});
