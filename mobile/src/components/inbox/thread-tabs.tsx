import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tavColors } from '@/lib/theme';
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
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              onChange(tab.id);
            }}
            style={[styles.tab, selected && styles.tabSelected]}>
            <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
            {tab.id === 'unread' && unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: tavColors.white,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  tabSelected: {
    backgroundColor: tavColors.zinc900,
    borderColor: tavColors.zinc900,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.zinc600,
  },
  tabLabelSelected: {
    color: tavColors.white,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: tavColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: tavColors.white,
  },
});
