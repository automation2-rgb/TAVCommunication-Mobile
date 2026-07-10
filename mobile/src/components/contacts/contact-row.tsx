import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isValidE164Phone } from '@/lib/phone/e164';
import { tavColors } from '@/lib/theme';
import type { ContactDirectoryRow } from '@/types/messaging';

type ContactRowProps = {
  contact: ContactDirectoryRow;
  /** Optional subtitle badge (e.g. role for team). */
  badge?: string | null;
  onPress: (contact: ContactDirectoryRow) => void;
};

export function ContactRow({ contact, badge, onPress }: ContactRowProps) {
  const phone = contact.phone_e164?.trim() ?? '';
  const canMessage = isValidE164Phone(phone);
  const title = contact.display_name?.trim() || phone || 'Unknown';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !canMessage }}
      disabled={!canMessage}
      onPress={() => {
        onPress(contact);
      }}
      style={({ pressed }) => [styles.row, pressed && canMessage && styles.rowPressed, !canMessage && styles.rowDisabled]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials(title)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {phone ? (
          <Text numberOfLines={1} style={styles.phone}>
            {phone}
          </Text>
        ) : (
          <Text style={styles.noPhone}>No phone number</Text>
        )}
        {contact.tags && contact.tags.length > 0 ? (
          <Text numberOfLines={1} style={styles.tags}>
            {contact.tags.join(' · ')}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  rowPressed: {
    backgroundColor: tavColors.zinc100,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tavColors.zinc100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.zinc700,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: tavColors.zinc100,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: tavColors.zinc600,
    textTransform: 'capitalize',
  },
  phone: {
    fontSize: 14,
    color: tavColors.zinc600,
  },
  noPhone: {
    fontSize: 13,
    color: tavColors.zinc400,
    fontStyle: 'italic',
  },
  tags: {
    fontSize: 12,
    color: tavColors.zinc500,
    marginTop: 2,
  },
});
