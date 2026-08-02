import { Archive, ArchiveRestore, ArrowLeft, MoreVertical } from '@/components/icons/lucide';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { pressScaleStyle, tavColors, tavLayout } from '@/lib/theme';

type ConversationHeaderProps = {
  title: string;
  subtitle?: string;
  phoneE164?: string | null;
  isDone: boolean;
  onBack: () => void;
  onToggleDone: () => void;
  onOpenMenu: () => void;
  voiceControls?: ReactNode;
};

export function ConversationHeader({
  title,
  subtitle,
  phoneE164,
  isDone,
  onBack,
  onToggleDone,
  onOpenMenu,
  voiceControls,
}: ConversationHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressScaleStyle(pressed)]}>
        <ArrowLeft color={tavColors.zinc700} size={20} strokeWidth={2.2} />
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>

      <ContactAvatar displayName={title} phoneE164={phoneE164 ?? subtitle} size="md" />

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

      {voiceControls}

      <Pressable
        accessibilityRole="button"
        onPress={onToggleDone}
        style={({ pressed }) => [styles.actionButton, pressScaleStyle(pressed)]}>
        {isDone ? (
          <ArchiveRestore color={tavColors.zinc700} size={18} strokeWidth={2.2} />
        ) : (
          <Archive color={tavColors.zinc700} size={18} strokeWidth={2.2} />
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.iconButton, pressScaleStyle(pressed)]}>
        <MoreVertical color={tavColors.zinc700} size={20} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    minHeight: tavLayout.headerHeight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.zinc700,
  },
  titleBlock: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  subtitle: {
    fontSize: 12,
    color: tavColors.zinc500,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc100,
  },
  iconButton: {
    width: tavLayout.iconButtonSize,
    height: tavLayout.iconButtonSize,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
