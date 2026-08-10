import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InboxIconTile } from '@/components/inbox/inbox-icon-tile';
import { formatE164AsUsDisplay } from '@/lib/phone/us-keypad';
import { tavColors, tavShadows } from '@/lib/theme';
import type { Inbox } from '@/types/messaging';

type VoiceInboxPickerSheetProps = {
  visible: boolean;
  inboxes: Inbox[];
  title?: string;
  subtitle?: string;
  onSelect: (inboxId: string) => void;
  onClose: () => void;
};

export function VoiceInboxPickerSheet({
  visible,
  inboxes,
  title = 'Call from',
  subtitle = 'Choose which inbox line to place this call from.',
  onSelect,
  onClose,
}: VoiceInboxPickerSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {inboxes.map((inbox) => (
          <Pressable
            key={inbox.id}
            accessibilityRole="button"
            onPress={() => {
              onSelect(inbox.id);
              onClose();
            }}
            style={styles.row}>
            <InboxIconTile inboxId={inbox.id} selected={false} unread={false} />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{inbox.display_name}</Text>
              <Text style={styles.rowMeta}>
                {inbox.twilio_phone_e164 ? formatE164AsUsDisplay(inbox.twilio_phone_e164) : 'Voice line'}
              </Text>
            </View>
          </Pressable>
        ))}
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
  },
  subtitle: {
    fontSize: 14,
    color: tavColors.zinc500,
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
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  rowMeta: {
    fontSize: 13,
    color: tavColors.zinc500,
  },
});
