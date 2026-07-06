import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AccountShell } from '@/components/auth/account-shell';
import { tavColors } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <AccountShell
      title="Settings"
      subtitle="Notification preferences and sound toggle arrive in Phase 8.">
      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backText}>← Back to inbox</Text>
      </Pressable>
    </AccountShell>
  );
}

const styles = StyleSheet.create({
  backLink: {
    paddingVertical: 8,
  },
  backText: {
    color: tavColors.blue,
    fontSize: 16,
    fontWeight: '500',
  },
});
