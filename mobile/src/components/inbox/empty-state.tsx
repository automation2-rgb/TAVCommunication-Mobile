import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tavColors } from '@/lib/theme';

type InboxEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
};

export function InboxEmptyState({ title, description, icon }: InboxEmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

export function getEmptyStateForTab(tab: 'active' | 'unread' | 'done', historyOnly = false) {
  if (historyOnly && tab === 'active') {
    return {
      title: 'No phone number',
      description: 'This inbox is history-only. Messages are visible but sending is disabled.',
    };
  }

  switch (tab) {
    case 'unread':
      return { title: 'All caught up', description: 'No unread conversations in this inbox.' };
    case 'done':
      return { title: 'No done deals yet', description: 'Closed deals will appear here.' };
    default:
      return { title: 'No conversations yet', description: 'Start a new conversation to message a customer.' };
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
    backgroundColor: tavColors.zinc100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: tavColors.zinc900,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc600,
    textAlign: 'center',
  },
});
