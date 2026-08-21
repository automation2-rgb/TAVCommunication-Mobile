import { type ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { ChevronRight } from '@/components/icons/lucide';
import { pressScaleStyle, tavColors, tavShadows, tavTypography } from '@/lib/theme';

type SupportScrollContentProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function SupportScrollContent({ children, style }: SupportScrollContentProps) {
  return <View style={[styles.scrollContent, style]}>{children}</View>;
}

type SupportSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SupportSection({ title, description, children }: SupportSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description ? <Text style={styles.sectionDescription}>{description}</Text> : null}
      {children}
    </View>
  );
}

type SupportCardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function SupportCard({ children, style }: SupportCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type SupportFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function SupportField({ label, hint, children }: SupportFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function SupportReadOnlyValue({ value }: { value: string }) {
  return <Text style={styles.readOnlyValue}>{value}</Text>;
}

type SupportTextInputProps = TextInputProps;

export function SupportTextInput({ style, onFocus, onBlur, ...rest }: SupportTextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...rest}
      placeholderTextColor={rest.placeholderTextColor ?? tavColors.zinc400}
      style={[styles.input, focused && styles.inputFocused, style]}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
    />
  );
}

type SupportBannerProps = {
  variant: 'error' | 'success';
  children: ReactNode;
};

export function SupportBanner({ variant, children }: SupportBannerProps) {
  return (
    <View style={[styles.banner, variant === 'error' ? styles.bannerError : styles.bannerSuccess]}>
      <Text style={[styles.bannerText, variant === 'error' ? styles.bannerTextError : styles.bannerTextSuccess]}>
        {children}
      </Text>
    </View>
  );
}

type SupportLinkListProps = {
  children: ReactNode;
};

export function SupportLinkList({ children }: SupportLinkListProps) {
  return <View style={styles.linkList}>{children}</View>;
}

type SupportLinkRowProps = {
  label: string;
  onPress: () => void;
  isLast?: boolean;
};

export function SupportLinkRow({ label, onPress, isLast = false }: SupportLinkRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        !isLast && styles.linkRowBorder,
        pressed && styles.linkRowPressed,
        pressScaleStyle(pressed),
      ]}>
      <Text style={styles.linkLabel}>{label}</Text>
      <ChevronRight color={tavColors.zinc400} size={18} strokeWidth={2.2} />
    </Pressable>
  );
}

type SupportSettingRowProps = {
  label: string;
  description?: string;
  right: ReactNode;
};

export function SupportSettingRow({ label, description, right }: SupportSettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description ? <Text style={styles.settingDescription}>{description}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SupportKbd({ children }: { children: string }) {
  return (
    <View style={styles.kbd}>
      <Text style={styles.kbdText}>{children}</Text>
    </View>
  );
}

export function SupportIntroText({ children }: { children: string }) {
  return <Text style={styles.introText}>{children}</Text>;
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 32,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...tavTypography.sectionTitle,
    fontSize: 17,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc600,
  },
  card: {
    backgroundColor: tavColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    padding: 20,
    gap: 16,
    ...tavShadows.sm,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  fieldHint: {
    fontSize: 13,
    lineHeight: 18,
    color: tavColors.zinc500,
  },
  readOnlyValue: {
    fontSize: 16,
    lineHeight: 22,
    color: tavColors.zinc700,
  },
  input: {
    borderWidth: 1,
    borderColor: tavColors.zinc300,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: tavColors.zinc900,
    backgroundColor: tavColors.white,
  },
  inputFocused: {
    borderColor: tavColors.blue,
    ...tavShadows.sm,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerError: {
    backgroundColor: tavColors.red50,
    borderColor: '#fecaca',
  },
  bannerSuccess: {
    backgroundColor: tavColors.emerald50,
    borderColor: '#a7f3d0',
  },
  bannerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bannerTextError: {
    color: tavColors.red600,
  },
  bannerTextSuccess: {
    color: tavColors.emerald600,
  },
  linkList: {
    marginHorizontal: -4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 10,
  },
  linkRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  linkRowPressed: {
    backgroundColor: tavColors.zinc50,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: tavColors.zinc500,
  },
  kbd: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    backgroundColor: tavColors.zinc100,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  kbdText: {
    fontSize: 12,
    fontWeight: '600',
    color: tavColors.zinc700,
    fontFamily: 'monospace',
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: tavColors.zinc600,
  },
});
