import { StyleSheet, Text, View } from 'react-native';

import { userAvatarInitials } from '@/lib/avatars/contact-avatar-utils';
import { tavColors, tavLayout } from '@/lib/theme';

type UserAvatarProps = {
  displayName?: string | null;
  email?: string | null;
  size?: number;
};

export function UserAvatar({ displayName, email, size = tavLayout.userAvatar }: UserAvatarProps) {
  const initials = userAvatarInitials(displayName, email);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      <Text style={[styles.initials, { fontSize: size <= 32 ? 12 : 14 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: tavColors.red600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: tavColors.white,
    fontWeight: '600',
  },
});
