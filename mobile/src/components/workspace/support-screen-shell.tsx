import { ArrowLeft } from '@/components/icons/lucide';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { pressScaleStyle, tavColors, tavLayout } from '@/lib/theme';

type SupportScreenShellProps = {
  title: string;
  children: ReactNode;
  onBack?: () => void;
  headerRight?: ReactNode;
  padded?: boolean;
};

export function SupportScreenShell({
  title,
  children,
  onBack,
  headerRight,
  padded = true,
}: SupportScreenShellProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          onPress={() => {
            if (onBack) {
              onBack();
              return;
            }
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/(app)/inbox');
          }}
          style={({ pressed }) => [styles.backButton, pressScaleStyle(pressed)]}>
          <ArrowLeft color={tavColors.zinc700} size={18} strokeWidth={2.2} />
          <Text style={styles.backText}>Inbox</Text>
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.headerRight}>{headerRight ?? <View style={styles.headerSpacer} />}</View>
      </View>
      {padded ? <View style={styles.body}>{children}</View> : children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tavColors.zinc50,
  },
  header: {
    minHeight: tavLayout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    backgroundColor: tavColors.white,
    gap: 8,
  },
  backButton: {
    minWidth: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.zinc700,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
    textAlign: 'center',
  },
  headerRight: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  headerSpacer: {
    width: 72,
  },
  body: {
    flex: 1,
    padding: 16,
  },
});
