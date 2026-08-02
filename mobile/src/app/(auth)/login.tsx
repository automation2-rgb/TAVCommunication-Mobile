import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { tavColors, tavShadows } from '@/lib/theme';

type LoginErrorCode = 'domain' | 'auth' | 'timeout';

function parseErrorParam(value: string | string[] | undefined): LoginErrorCode | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'domain' || raw === 'auth' || raw === 'timeout') {
    return raw;
  }
  return null;
}

export default function LoginScreen() {
  const params = useLocalSearchParams<{ error?: string | string[] }>();
  const initialError = useMemo(() => parseErrorParam(params.error), [params.error]);
  const [errorCode, setErrorCode] = useState<LoginErrorCode | null>(initialError);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.container}>
        <View style={styles.logoCard}>
          <Text style={styles.logoMark}>TAV</Text>
        </View>

        <Text style={styles.headline}>TAV Communication</Text>
        <Text style={styles.subtitle}>Sign in with your Texas Auto Value Google account.</Text>

        <View style={styles.signInCard}>
          {errorCode ? <AuthErrorBanner code={errorCode} /> : null}

          <GoogleSignInButton
            onError={(code) => {
              setErrorCode(code);
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tavColors.zinc950,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(220, 38, 38, 0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    right: -30,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  logoCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoMark: {
    color: tavColors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headline: {
    color: tavColors.white,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: tavColors.zinc400,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  signInCard: {
    backgroundColor: 'rgba(24, 24, 27, 0.72)',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    ...tavShadows.lg,
  },
});
