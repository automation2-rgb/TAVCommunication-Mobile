import { Archive, Inbox, MessageSquare, Send } from '@/components/icons/lucide';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tavColors, tavTypography } from '@/lib/theme';

export type EmptyStateVariant =
  | 'no-threads'
  | 'no-threads-history'
  | 'no-archived-threads'
  | 'no-unread-threads'
  | 'no-messages'
  | 'select-thread'
  | 'no-inboxes-assigned';

type InboxEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  variant?: EmptyStateVariant;
};

const VARIANTS: Record<
  EmptyStateVariant,
  { backgroundColor: string; Icon: typeof MessageSquare; iconColor: string }
> = {
  'no-threads': { backgroundColor: tavColors.zinc200, Icon: MessageSquare, iconColor: tavColors.zinc600 },
  'no-threads-history': { backgroundColor: tavColors.amber100, Icon: Archive, iconColor: tavColors.amber800 },
  'no-archived-threads': { backgroundColor: tavColors.zinc200, Icon: Archive, iconColor: tavColors.zinc600 },
  'no-unread-threads': { backgroundColor: tavColors.zinc200, Icon: MessageSquare, iconColor: tavColors.zinc600 },
  'no-messages': { backgroundColor: tavColors.emerald100, Icon: Send, iconColor: tavColors.emerald600 },
  'select-thread': { backgroundColor: tavColors.zinc100, Icon: Inbox, iconColor: tavColors.zinc600 },
  'no-inboxes-assigned': { backgroundColor: tavColors.amber100, Icon: Inbox, iconColor: tavColors.amber800 },
};

export function InboxEmptyState({ title, description, icon, variant = 'no-threads' }: InboxEmptyStateProps) {
  const preset = VARIANTS[variant];
  const Icon = preset.Icon;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: preset.backgroundColor }]}>
        {icon ?? <Icon color={preset.iconColor} size={24} strokeWidth={2} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function getEmptyStateForTab(tab: 'active' | 'unread' | 'done', historyOnly = false) {
  if (historyOnly && tab === 'active') {
    return {
      variant: 'no-threads-history' as const,
      title: 'No phone number',
      description: 'This inbox is history-only. Messages are visible but sending is disabled.',
    };
  }

  switch (tab) {
    case 'unread':
      return {
        variant: 'no-unread-threads' as const,
        title: 'All caught up',
        description: 'No unread conversations in this inbox.',
      };
    case 'done':
      return {
        variant: 'no-archived-threads' as const,
        title: 'No done deals yet',
        description: 'Closed deals will appear here.',
      };
    default:
      return {
        variant: 'no-threads' as const,
        title: 'No conversations yet',
        description: 'Start a new conversation to message a customer.',
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    ...tavTypography.emptyTitle,
    textAlign: 'center',
  },
  description: {
    ...tavTypography.emptyBody,
    textAlign: 'center',
  },
});
