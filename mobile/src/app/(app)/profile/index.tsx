import { Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { UserAvatar } from '@/components/avatars/user-avatar';
import { AuthButton } from '@/components/auth/auth-button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { ProfilePhotoCropModal } from '@/components/profile/profile-photo-crop-modal';
import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import {
  SupportBanner,
  SupportCard,
  SupportField,
  SupportLinkList,
  SupportLinkRow,
  SupportReadOnlyValue,
  SupportScrollContent,
  SupportSection,
  SupportTextInput,
} from '@/components/workspace/support-screen-ui';
import { useProfileAvatarPicker, type ProfilePhotoSelection } from '@/hooks/use-profile-avatar-picker';
import { useAuth } from '@/lib/auth/auth-provider';
import { isValidE164Phone } from '@/lib/phone/e164';
import { removeProfileAvatar, uploadProfileAvatar } from '@/lib/profile/avatar-storage';
import { updateOwnProfile } from '@/lib/profile/update-profile';
import { tavColors, tavLayout } from '@/lib/theme';

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
        <ScrollView contentContainerStyle={styles.scrollGrow} keyboardShouldPersistTaps="handled">
          <SupportScrollContent>
            <SupportCard style={styles.avatarCard}>
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
            </SupportCard>

            {errorMessage ? <SupportBanner variant="error">{errorMessage}</SupportBanner> : null}
            {successMessage ? <SupportBanner variant="success">{successMessage}</SupportBanner> : null}

            <SupportSection title="Account">
              <SupportCard>
                <SupportField label="Email">
                  <SupportReadOnlyValue value={profile?.email ?? '—'} />
                </SupportField>
                <SupportField hint="Assigned by administrator" label="Role">
                  <SupportReadOnlyValue value={roleLabel(profile?.role)} />
                </SupportField>
              </SupportCard>
            </SupportSection>

            <SupportSection
              description="Your name and phone appear to teammates and on outbound messages when applicable."
              title="Your details">
              <SupportCard>
                <SupportField label="Display name">
                  <SupportTextInput
                    autoCapitalize="words"
                    autoCorrect={false}
                    placeholder="Your name"
                    value={displayName}
                    onChangeText={(value) => {
                      setDisplayName(value);
                      setSuccessMessage(null);
                    }}
                  />
                </SupportField>
                <SupportField hint="Optional. Used for teammate SMS and voice." label="Mobile phone (E.164)">
                  <SupportTextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="phone-pad"
                    placeholder="+15551234567"
                    value={phoneE164}
                    onChangeText={(value) => {
                      setPhoneE164(value);
                      setSuccessMessage(null);
                    }}
                  />
                </SupportField>
                <AuthButton
                  disabled={isSaving || !hasChanges}
                  label={isSaving ? 'Saving…' : 'Save changes'}
                  onPress={() => {
                    void handleSave();
                  }}
                />
              </SupportCard>
            </SupportSection>

            <SupportSection title="More">
              <SupportCard style={styles.linkCard}>
                <SupportLinkList>
                  <SupportLinkRow
                    label="Settings"
                    onPress={() => router.push('/(app)/settings' as Href)}
                  />
                  <SupportLinkRow
                    isLast
                    label="Help"
                    onPress={() => router.push('/(app)/help' as Href)}
                  />
                </SupportLinkList>
              </SupportCard>
            </SupportSection>

            <SignOutButton variant="secondary" />
          </SupportScrollContent>
        </ScrollView>
      </SupportScreenShell>
    </>
  );
}

const styles = StyleSheet.create({
  scrollGrow: {
    flexGrow: 1,
  },
  avatarCard: {
    alignItems: 'center',
    gap: 10,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarButtonPressed: {
    opacity: 0.85,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  avatarHint: {
    fontSize: 13,
    color: tavColors.zinc500,
    textAlign: 'center',
  },
  linkCard: {
    paddingVertical: 8,
    gap: 0,
  },
});
