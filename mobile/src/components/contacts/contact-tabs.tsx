import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tavColors } from '@/lib/theme';
import type { ContactDirectoryKind } from '@/types/messaging';

const TABS: Array<{ id: ContactDirectoryKind; label: string }> = [
  { id: 'external', label: 'External' },
  { id: 'team', label: 'Team' },
];

type ContactTabsProps = {
  activeTab: ContactDirectoryKind;
  onChange: (tab: ContactDirectoryKind) => void;
};

export function ContactTabs({ activeTab, onChange }: ContactTabsProps) {
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
    paddingHorizontal: 14,
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
});
