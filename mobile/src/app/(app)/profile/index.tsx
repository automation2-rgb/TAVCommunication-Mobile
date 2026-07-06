import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AccountShell } from '@/components/auth/account-shell';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { useAuth } from '@/lib/auth/auth-provider';
import { tavColors } from '@/lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <AccountShell
      title="Profile"
      subtitle="Edit display name and phone in Phase 8."
      footer={<SignOutButton variant="secondary" />}>
      <Text style={styles.meta}>Email: {profile?.email ?? '—'}</Text>
      <Text style={styles.meta}>Name: {profile?.display_name ?? '—'}</Text>
      <Text style={styles.meta}>Phone: {profile?.phone_e164 ?? '—'}</Text>
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backText}>← Back to inbox</Text>
      </Pressable>
    </AccountShell>
  );
}

const styles = StyleSheet.create({
  meta: {
    fontSize: 15,
    color: tavColors.zinc700,
  },
  backLink: {
    paddingVertical: 8,
  },
  backText: {
    color: tavColors.blue,
    fontSize: 16,
    fontWeight: '500',
  },
});
