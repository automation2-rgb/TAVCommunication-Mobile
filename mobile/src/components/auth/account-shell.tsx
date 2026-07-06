import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tavColors } from '@/lib/theme';

type AccountShellProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function AccountShell({ title, subtitle, children, footer }: AccountShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>TAV Communication</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tavColors.zinc50,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brand: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  card: {
    backgroundColor: tavColors.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: tavColors.zinc600,
  },
  body: {
    gap: 16,
  },
  footer: {
    gap: 12,
    marginTop: 8,
  },
});
