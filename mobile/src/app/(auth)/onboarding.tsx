import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AccountShell } from '@/components/auth/account-shell';
import { AuthButton } from '@/components/auth/auth-button';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { useAuth } from '@/lib/auth/auth-provider';
import {
  fetchOnboardingInboxes,
  isValidE164Phone,
  submitOnboardingApplication,
} from '@/lib/onboarding/apply';
import type { OnboardingInboxOption } from '@/lib/onboarding/inbox-options';
import { tavColors } from '@/lib/theme';

export default function OnboardingScreen() {
  const { refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneE164, setPhoneE164] = useState('');
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [inboxOptions, setInboxOptions] = useState<OnboardingInboxOption[]>([]);
  const [isLoadingInboxes, setIsLoadingInboxes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetchOnboardingInboxes()
      .then(setInboxOptions)
      .finally(() => {
        setIsLoadingInboxes(false);
      });
  }, []);

  const toggleInbox = (slug: string) => {
    setSelectedSlugs((current) =>
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug],
    );
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First and last name are required.');
      return;
    }

    if (!isValidE164Phone(phoneE164)) {
      setErrorMessage('Enter a valid phone number in E.164 format, such as +15551234567.');
      return;
    }

    if (selectedSlugs.length === 0) {
      setErrorMessage('Select at least one inbox.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitOnboardingApplication({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneE164: phoneE164.trim(),
        inboxSlugs: selectedSlugs,
      });
      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AccountShell
      title="Request access"
      subtitle="Tell us who you are and which inboxes you need. An administrator will review your request."
      footer={
        <>
          <AuthButton
            disabled={isSubmitting}
            label={isSubmitting ? 'Submitting…' : 'Submit application'}
            onPress={() => {
              void handleSubmit();
            }}
          />
          <SignOutButton />
        </>
      }>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>First name</Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Last name</Text>
        <TextInput
          autoCapitalize="words"
          autoCorrect={false}
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
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
          onChangeText={setPhoneE164}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Requested inboxes</Text>
        {isLoadingInboxes ? (
          <ActivityIndicator color={tavColors.blue} />
        ) : (
          <View style={styles.checkboxList}>
            {inboxOptions.map((option) => {
              const selected = selectedSlugs.includes(option.slug);
              return (
                <Pressable
                  key={option.slug}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    toggleInbox(option.slug);
                  }}
                  style={[styles.checkboxRow, selected && styles.checkboxRowSelected]}>
                  <View style={[styles.checkbox, selected && styles.checkboxSelected]} />
                  <Text style={styles.checkboxLabel}>{option.displayName}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </AccountShell>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.zinc900,
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
  checkboxList: {
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    padding: 12,
  },
  checkboxRowSelected: {
    borderColor: tavColors.blue,
    backgroundColor: '#eff6ff',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tavColors.zinc500,
    backgroundColor: tavColors.white,
  },
  checkboxSelected: {
    borderColor: tavColors.blue,
    backgroundColor: tavColors.blue,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: tavColors.zinc900,
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
});
