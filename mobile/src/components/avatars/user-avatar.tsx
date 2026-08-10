import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useProfileAvatarUrl } from '@/hooks/use-profile-avatar-url';
import {
  contactAvatarColor,
  contactAvatarInitials,
  contactAvatarSeed,
  userAvatarInitials,
} from '@/lib/avatars/contact-avatar-utils';
import { tavColors, tavLayout } from '@/lib/theme';

type UserAvatarProps = {
  displayName?: string | null;
  email?: string | null;
  phoneE164?: string | null;
  avatarStoragePath?: string | null;
  size?: number;
  variant?: 'user' | 'contact';
};

export function UserAvatar({
  displayName,
  email,
  phoneE164,
  avatarStoragePath,
  size = tavLayout.userAvatar,
  variant = 'user',
}: UserAvatarProps) {
  const imageUrl = useProfileAvatarUrl(avatarStoragePath);
  const initials =
    variant === 'contact'
      ? contactAvatarInitials(displayName, phoneE164)
      : userAvatarInitials(displayName, email);
  const backgroundColor =
    variant === 'contact'
      ? contactAvatarColor(contactAvatarSeed(displayName, phoneE164))
      : tavColors.red600;

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}>
      {imageUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size <= 32 ? 12 : 14 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: tavColors.white,
    fontWeight: '600',
  },
});
