import { Href, useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { signOut } from '@/lib/auth/sign-out';
import { tavColors } from '@/lib/theme';

type UserMenuSheetProps = {
  visible: boolean;
  displayName?: string | null;
  onClose: () => void;
};

const MENU_ITEMS: Array<{ label: string; href: Href }> = [
  { label: 'Contacts', href: '/(app)/contacts/index' as Href },
  { label: 'Profile', href: '/(app)/profile/index' as Href },
  { label: 'Settings', href: '/(app)/settings/index' as Href },
  { label: 'Help', href: '/(app)/help/index' as Href },
];

export function UserMenuSheet({ visible, displayName, onClose }: UserMenuSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
            style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            void signOut();
          }}
          style={[styles.row, styles.signOutRow]}>
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: tavColors.zinc500,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 15,
    color: tavColors.zinc900,
  },
  signOutRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tavColors.zinc200,
    marginTop: 4,
  },
  signOutLabel: {
    fontSize: 15,
    color: tavColors.red600,
    fontWeight: '500',
  },
});
