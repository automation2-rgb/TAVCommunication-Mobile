import { StyleSheet, Text, View } from 'react-native';

import { tavColors } from '@/lib/theme';

type AuthErrorBannerProps = {
  code: 'domain' | 'auth' | 'timeout';
};

const ERROR_MESSAGES: Record<AuthErrorBannerProps['code'], string> = {
  domain: 'Sign in with your @texasautovalue.com Google account to continue.',
  auth: 'Google sign-in failed. Please try again.',
  timeout: 'Sign-in timed out. Please try again.',
};

export function AuthErrorBanner({ code }: AuthErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{ERROR_MESSAGES[code]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tavColors.red50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
  },
  text: {
    color: tavColors.red600,
    fontSize: 14,
    lineHeight: 20,
  },
});
