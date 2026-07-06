import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { tavColors } from '@/lib/theme';

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
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.brand}>TAV Communication</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Use your Texas Auto Value Google account to continue.</Text>

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
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: tavColors.zinc900,
    borderRadius: 16,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: tavColors.zinc700,
  },
  brand: {
    color: tavColors.zinc200,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    color: tavColors.white,
    fontSize: 32,
    fontWeight: '600',
  },
  subtitle: {
    color: tavColors.zinc500,
    fontSize: 16,
    lineHeight: 24,
  },
});
