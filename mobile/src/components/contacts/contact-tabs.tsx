import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tavColors, tavShadows } from '@/lib/theme';
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
      <View style={styles.switcher}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  switcher: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: tavColors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    padding: 4,
    ...tavShadows.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabSelected: {
    backgroundColor: tavColors.zinc100,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.zinc600,
  },
  tabLabelSelected: {
    color: tavColors.zinc900,
    fontWeight: '600',
  },
});
