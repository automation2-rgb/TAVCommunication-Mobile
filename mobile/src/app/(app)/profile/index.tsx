import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import { useAuth } from '@/lib/auth/auth-provider';
import { isValidE164Phone } from '@/lib/phone/e164';
import { updateOwnProfile } from '@/lib/profile/update-profile';
import { tavColors } from '@/lib/theme';

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
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [phoneE164, setPhoneE164] = useState(profile?.phone_e164 ?? '');
  const [isSaving, setIsSaving] = useState(false);
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

  return (
    <SupportScreenShell title="Profile" padded={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
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

        <SignOutButton variant="secondary" />
      </ScrollView>
    </SupportScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
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
});
