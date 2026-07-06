import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tavColors } from '@/lib/theme';
import type { Inbox } from '@/types/messaging';

type InboxSwitcherSheetProps = {
  visible: boolean;
  inboxes: Inbox[];
  activeInboxId: string | null;
  unreadCounts: Record<string, number>;
  onSelect: (inboxId: string) => void;
  onClose: () => void;
};

export function InboxSwitcherSheet({
  visible,
  inboxes,
  activeInboxId,
  unreadCounts,
  onSelect,
  onClose,
}: InboxSwitcherSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>Switch inbox</Text>
        {inboxes.map((inbox) => {
          const selected = inbox.id === activeInboxId;
          const unread = unreadCounts[inbox.id] ?? 0;
          return (
            <Pressable
              key={inbox.id}
              accessibilityRole="button"
              onPress={() => {
                onSelect(inbox.id);
                onClose();
              }}
              style={[styles.row, selected && styles.rowSelected]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>{inbox.display_name}</Text>
                {!inbox.twilio_phone_e164 ? (
                  <Text style={styles.rowMeta}>History only</Text>
                ) : null}
              </View>
              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: tavColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  rowSelected: {
    backgroundColor: tavColors.zinc100,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    color: tavColors.zinc900,
  },
  rowTitleSelected: {
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 12,
    color: tavColors.zinc500,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: tavColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: tavColors.white,
  },
});
