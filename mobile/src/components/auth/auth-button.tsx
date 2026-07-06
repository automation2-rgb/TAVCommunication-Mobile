import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { tavColors } from '@/lib/theme';

type AuthButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function AuthButton({ label, variant = 'primary', disabled, style, ...rest }: AuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        typeof style === 'function' ? style({ pressed, hovered: false }) : style,
      ]}
      {...rest}>
      <Text
        style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant === 'secondary' && styles.secondaryLabel,
          variant === 'ghost' && styles.ghostLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: tavColors.blue,
  },
  secondary: {
    backgroundColor: tavColors.white,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryLabel: {
    color: tavColors.white,
  },
  secondaryLabel: {
    color: tavColors.zinc900,
  },
  ghostLabel: {
    color: tavColors.zinc600,
  },
});
