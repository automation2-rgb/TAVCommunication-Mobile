import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { UserAvatar } from '@/components/avatars/user-avatar';
import { isValidE164Phone } from '@/lib/phone/e164';
import { tavColors, tavLayout } from '@/lib/theme';
import type { ContactDirectoryRow } from '@/types/messaging';

type ContactRowProps = {
  contact: ContactDirectoryRow;
  badge?: string | null;
  onPress: (contact: ContactDirectoryRow) => void;
  disabled?: boolean;
};

export const ContactRow = memo(function ContactRow({
  contact,
  badge,
  onPress,
  disabled = false,
}: ContactRowProps) {
  const phone = contact.phone_e164?.trim() ?? '';
  const hasPhone = isValidE164Phone(phone);
  const title = contact.display_name?.trim() || phone || 'Unknown';
  const isTeamContact = contact.source === 'team';
  const isDisabled = disabled || (!isTeamContact && !hasPhone);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      delayPressIn={100}
      disabled={isDisabled}
      onPress={() => {
        onPress(contact);
      }}
      style={({ pressed }) => [
        styles.row,
        pressed && !isDisabled && styles.rowPressed,
        isDisabled && styles.rowDisabled,
      ]}>
      {isTeamContact ? (
        <UserAvatar
          avatarStoragePath={contact.avatar_storage_path}
          displayName={contact.display_name}
          email={null}
          phoneE164={phone}
          size={tavLayout.avatarMd}
          variant="contact"
        />
      ) : (
        <ContactAvatar displayName={contact.display_name} phoneE164={phone} size="md" />
      )}
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
          <View style={styles.tagRow}>
            {contact.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

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
    backgroundColor: tavColors.zinc50,
  },
  rowDisabled: {
    opacity: 0.55,
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
    color: tavColors.zinc500,
  },
  noPhone: {
    fontSize: 13,
    color: tavColors.zinc400,
    fontStyle: 'italic',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: tavColors.zinc100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    color: tavColors.zinc600,
  },
});
