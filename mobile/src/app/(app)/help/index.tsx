import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AccountShell } from '@/components/auth/account-shell';
import { tavColors } from '@/lib/theme';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <AccountShell
      title="Help"
      subtitle="Static help topics matching the web app will be added in Phase 8.">
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
