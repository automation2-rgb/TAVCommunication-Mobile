import { Pressable, StyleSheet, Text, View } from 'react-native';

import { pressScaleStyle, tavColors, tavShadows } from '@/lib/theme';

type SegmentedControlProps<T extends string> = {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressScaleStyle(pressed)]}>
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: tavColors.zinc200,
    gap: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segmentSelected: {
    backgroundColor: tavColors.white,
    ...tavShadows.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.zinc600,
  },
  labelSelected: {
    color: tavColors.zinc900,
  },
});
