import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tavColors, tavLayout } from '@/lib/theme';

type ConversationHeaderProps = {
  title: string;
  subtitle?: string;
  isDone: boolean;
  onBack: () => void;
  onToggleDone: () => void;
  onOpenMenu: () => void;
};

export function ConversationHeader({
  title,
  subtitle,
  isDone,
  onBack,
  onToggleDone,
  onOpenMenu,
}: ConversationHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>‹</Text>
      </Pressable>

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Pressable accessibilityRole="button" onPress={onToggleDone} style={styles.actionButton}>
        <Text style={styles.actionLabel}>{isDone ? 'Reopen' : 'Done'}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={onOpenMenu} style={styles.iconButton}>
        <Text style={styles.iconLabel}>⋯</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    minHeight: tavLayout.headerHeight,
  },
  backButton: {
    width: tavLayout.iconButtonSize,
    height: tavLayout.iconButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLabel: {
    fontSize: 28,
    lineHeight: 28,
    color: tavColors.blue,
    marginTop: -2,
  },
  titleBlock: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  subtitle: {
    fontSize: 12,
    color: tavColors.zinc500,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: tavColors.zinc100,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.zinc700,
  },
  iconButton: {
    width: tavLayout.iconButtonSize,
    height: tavLayout.iconButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    fontSize: 22,
    color: tavColors.zinc700,
    marginTop: -6,
  },
});
