import { Check } from '@/components/icons/lucide';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InboxIconTile } from '@/components/inbox/inbox-icon-tile';
import { tavColors, tavLayout, tavShadows } from '@/lib/theme';
import type { Inbox } from '@/types/messaging';

type InboxSwitcherSheetProps = {
  visible: boolean;
  inboxes: Inbox[];
  activeInboxId: string | null;
  unreadCounts: Record<string, number>;
  onSelect: (inboxId: string) => void;
  onClose: () => void;
};

function formatPhoneLabel(phone: string | null): string {
  if (!phone) {
    return 'History only';
  }
  return phone;
}

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
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, maxHeight: '80%' }]}>
        <Text style={styles.title}>Select Inbox</Text>
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
              style={[styles.row, selected && styles.rowSelected, unread > 0 && styles.rowUnread]}>
              <InboxIconTile inboxId={inbox.id} selected={selected} unread={unread > 0 && !selected} />
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, selected && styles.rowTitleSelected]}>{inbox.display_name}</Text>
                <Text style={styles.rowMeta}>{formatPhoneLabel(inbox.twilio_phone_e164)}</Text>
              </View>
              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              ) : null}
              {selected ? <Check color={tavColors.blue} size={20} strokeWidth={2.5} /> : null}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: tavColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 4,
    ...tavShadows.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: tavColors.zinc900,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  rowSelected: {
    backgroundColor: tavColors.zinc100,
  },
  rowUnread: {
    borderLeftWidth: 4,
    borderLeftColor: tavColors.blue,
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
