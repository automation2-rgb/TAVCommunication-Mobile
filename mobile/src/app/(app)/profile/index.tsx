import { Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { UserAvatar } from '@/components/avatars/user-avatar';
import { AuthButton } from '@/components/auth/auth-button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { ProfilePhotoCropModal } from '@/components/profile/profile-photo-crop-modal';
import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import { useProfileAvatarPicker, type ProfilePhotoSelection } from '@/hooks/use-profile-avatar-picker';
import { useAuth } from '@/lib/auth/auth-provider';
import { isValidE164Phone } from '@/lib/phone/e164';
import { removeProfileAvatar, uploadProfileAvatar } from '@/lib/profile/avatar-storage';
import { updateOwnProfile } from '@/lib/profile/update-profile';
import { pressScaleStyle, tavColors, tavLayout } from '@/lib/theme';

function roleLabel(role: string | undefined) {
  if (role === 'admin') {
    return 'Admin';
  }
  if (role === 'member') {
    return 'Member';
  }
  return role ?? '—';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, refreshProfile, session } = useAuth();
  const { promptForPhoto } = useProfileAvatarPicker();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [phoneE164, setPhoneE164] = useState(profile?.phone_e164 ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isAvatarBusy, setIsAvatarBusy] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<ProfilePhotoSelection | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setPhoneE164(profile?.phone_e164 ?? '');
  }, [profile?.display_name, profile?.phone_e164]);

  const hasChanges = useMemo(() => {
    const nextName = displayName.trim() || null;
    const nextPhone = phoneE164.trim() || null;
    const currentName = profile?.display_name?.trim() || null;
    const currentPhone = profile?.phone_e164?.trim() || null;
    return nextName !== currentName || nextPhone !== currentPhone;
  }, [displayName, phoneE164, profile?.display_name, profile?.phone_e164]);

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedPhone = phoneE164.trim();
    if (trimmedPhone.length > 0 && !isValidE164Phone(trimmedPhone)) {
      setErrorMessage('Enter a valid phone number in E.164 format, such as +15551234567.');
      return;
    }

    setIsSaving(true);
    try {
      await updateOwnProfile({
        displayName,
        phoneE164,
      });
      await refreshProfile();
      setSuccessMessage('Profile saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save your profile.';
      setErrorMessage(message);
      Alert.alert('Could not save', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhoto = async (selection: {
    uri: string;
    name: string;
    mimeType: string;
    sizeBytes?: number;
    alreadyPrepared?: boolean;
  }) => {
    const userId = session?.user.id;
    if (!userId) {
      Alert.alert('Sign in required', 'You must be signed in to update your profile photo.');
      return;
    }

    setIsAvatarBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await uploadProfileAvatar({
        userId,
        uri: selection.uri,
        name: selection.name,
        mimeType: selection.mimeType,
        sizeBytes: selection.sizeBytes,
        alreadyPrepared: selection.alreadyPrepared,
      });
      await refreshProfile();
      setSuccessMessage('Profile photo updated.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update your profile photo.';
      setErrorMessage(message);
      Alert.alert('Could not update photo', message);
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    const userId = session?.user.id;
    if (!userId) {
      return;
    }

    setIsAvatarBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await removeProfileAvatar(userId, profile?.avatar_storage_path);
      await refreshProfile();
      setSuccessMessage('Profile photo removed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to remove your profile photo.';
      setErrorMessage(message);
      Alert.alert('Could not remove photo', message);
    } finally {
      setIsAvatarBusy(false);
    }
  };

  const openPhotoOptions = () => {
    if (isAvatarBusy) {
      return;
    }

    promptForPhoto({
      hasPhoto: Boolean(profile?.avatar_storage_path),
      onPick: (selection) => {
        setPendingPhoto(selection);
      },
      onRemove: () => {
        void handleRemovePhoto();
      },
    });
  };

  return (
    <>
      {pendingPhoto ? (
        <ProfilePhotoCropModal
          fileName={pendingPhoto.name}
          mimeType={pendingPhoto.mimeType}
          uri={pendingPhoto.uri}
          visible
          onCancel={() => {
            setPendingPhoto(null);
          }}
          onConfirm={async (prepared) => {
            setPendingPhoto(null);
            await handleUploadPhoto({ ...prepared, alreadyPrepared: true });
          }}
        />
      ) : null}
      <SupportScreenShell title="Profile" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            disabled={isAvatarBusy}
            onPress={openPhotoOptions}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.avatarButtonPressed]}>
            <UserAvatar
              avatarStoragePath={profile?.avatar_storage_path}
              displayName={profile?.display_name}
              email={profile?.email}
              size={tavLayout.avatarLg + 16}
            />
            {isAvatarBusy ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={tavColors.white} />
              </View>
            ) : null}
          </Pressable>
          <Text style={styles.avatarHint}>Tap to change your profile photo</Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {successMessage ? (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.readOnlyValue}>{profile?.email ?? '—'}</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.readOnlyValue}>{roleLabel(profile?.role)}</Text>
          <Text style={styles.hint}>Assigned by administrator</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            placeholder="Your name"
            placeholderTextColor={tavColors.zinc500}
            style={styles.input}
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              setSuccessMessage(null);
            }}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mobile phone (E.164)</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            placeholder="+15551234567"
            placeholderTextColor={tavColors.zinc500}
            style={styles.input}
            value={phoneE164}
            onChangeText={(value) => {
              setPhoneE164(value);
              setSuccessMessage(null);
            }}
          />
          <Text style={styles.hint}>Optional. Used for teammate SMS and voice.</Text>
        </View>

        <AuthButton
          disabled={isSaving || !hasChanges}
          label={isSaving ? 'Saving…' : 'Save changes'}
          onPress={() => {
            void handleSave();
          }}
        />

        <View style={styles.linkSection}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/settings' as Href)}
            style={({ pressed }) => [styles.linkRow, pressScaleStyle(pressed)]}>
            <Text style={styles.linkLabel}>Settings</Text>
            <Text style={styles.linkChevron}>›</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/help' as Href)}
            style={({ pressed }) => [styles.linkRow, styles.linkRowLast, pressScaleStyle(pressed)]}>
            <Text style={styles.linkLabel}>Help</Text>
            <Text style={styles.linkChevron}>›</Text>
          </Pressable>
        </View>

        <SignOutButton variant="secondary" />
      </ScrollView>
    </SupportScreenShell>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarButtonPressed: {
    opacity: 0.85,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  avatarHint: {
    fontSize: 13,
    color: tavColors.zinc500,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  readOnlyValue: {
    fontSize: 16,
    color: tavColors.zinc700,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: tavColors.zinc500,
  },
  input: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: tavColors.zinc900,
    backgroundColor: tavColors.white,
  },
  errorBanner: {
    backgroundColor: tavColors.red50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
  },
  errorText: {
    color: tavColors.red600,
    fontSize: 14,
    lineHeight: 20,
  },
  successBanner: {
    backgroundColor: tavColors.emerald50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
  },
  successText: {
    color: tavColors.emerald600,
    fontSize: 14,
    lineHeight: 20,
  },
  linkSection: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    backgroundColor: tavColors.white,
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  linkRowLast: {
    borderBottomWidth: 0,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  linkChevron: {
    fontSize: 22,
    color: tavColors.zinc400,
    lineHeight: 22,
  },
});
