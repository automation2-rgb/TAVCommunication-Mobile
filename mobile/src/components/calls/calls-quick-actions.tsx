import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Grid3x3, Phone, type LucideIcon } from '@/components/icons/lucide';
import { pressScaleStyle, tavColors } from '@/lib/theme';

type CallsQuickActionsProps = {
  onNewCall: () => void;
  onOpenKeypad: () => void;
};

type QuickAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
};

export function CallsQuickActions({ onNewCall, onOpenKeypad }: CallsQuickActionsProps) {
  const actions: QuickAction[] = [
    { key: 'call', label: 'Call', icon: Phone, onPress: onNewCall },
    { key: 'keypad', label: 'Keypad', icon: Grid3x3, onPress: onOpenKeypad },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            onPress={action.onPress}
            style={({ pressed }) => [styles.action, pressScaleStyle(pressed)]}>
            <View style={styles.iconCircle}>
              <Icon color={tavColors.zinc700} size={22} strokeWidth={2.2} />
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: tavColors.white,
  },
  action: {
    alignItems: 'center',
    gap: 8,
    minWidth: 72,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc100,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: tavColors.zinc700,
  },
});
