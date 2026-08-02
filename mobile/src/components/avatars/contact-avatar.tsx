import { StyleSheet, Text, View } from 'react-native';

import {
  contactAvatarColor,
  contactAvatarInitials,
  contactAvatarSeed,
} from '@/lib/avatars/contact-avatar-utils';
import { tavColors, tavLayout } from '@/lib/theme';

export type ContactAvatarSize = 'sm' | 'md' | 'lg';

type ContactAvatarProps = {
  displayName?: string | null;
  phoneE164?: string | null;
  size?: ContactAvatarSize;
  showUnreadDot?: boolean;
};

const SIZE_MAP = {
  sm: { box: tavLayout.avatarSm, fontSize: 12 },
  md: { box: tavLayout.avatarMd, fontSize: 14 },
  lg: { box: tavLayout.avatarLg, fontSize: 16 },
} as const;

export function ContactAvatar({
  displayName,
  phoneE164,
  size = 'md',
  showUnreadDot = false,
}: ContactAvatarProps) {
  const dimensions = SIZE_MAP[size];
  const seed = contactAvatarSeed(displayName, phoneE164);
  const backgroundColor = contactAvatarColor(seed);
  const initials = contactAvatarInitials(displayName, phoneE164);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.circle,
          {
            width: dimensions.box,
            height: dimensions.box,
            borderRadius: dimensions.box / 2,
            backgroundColor,
          },
        ]}>
        <Text style={[styles.initials, { fontSize: dimensions.fontSize }]}>{initials}</Text>
      </View>
      {showUnreadDot ? <View style={styles.unreadDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: tavColors.white,
    fontWeight: '600',
  },
  unreadDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tavColors.blue,
    borderWidth: 2,
    borderColor: tavColors.white,
  },
});
