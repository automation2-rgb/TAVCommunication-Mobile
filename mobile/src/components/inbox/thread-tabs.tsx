import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tavColors, tavShadows, tavTypography } from '@/lib/theme';
import type { ThreadListTab } from '@/types/messaging';

const TABS: Array<{ id: ThreadListTab; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'unread', label: 'Unread' },
  { id: 'done', label: 'Done Deals' },
];

type ThreadTabsProps = {
  activeTab: ThreadListTab;
  unreadCount: number;
  onChange: (tab: ThreadListTab) => void;
};

export function ThreadTabs({ activeTab, unreadCount, onChange }: ThreadTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const selected = tab.id === activeTab;
        const showUnreadCount = tab.id === 'unread' && unreadCount > 0;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(tab.id);
            }}
            style={({ pressed }) => [styles.tab, selected && styles.tabSelected, pressed && styles.tabPressed]}>
            <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
              {tab.label}
              {showUnreadCount ? ` (${unreadCount > 99 ? '99+' : unreadCount})` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(228, 228, 231, 0.8)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabSelected: {
    backgroundColor: tavColors.white,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    ...tavShadows.sm,
  },
  tabPressed: {
    opacity: 0.9,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: tavColors.zinc600,
    textAlign: 'center',
  },
  tabLabelSelected: {
    color: tavColors.zinc900,
    fontWeight: '600',
  },
});
