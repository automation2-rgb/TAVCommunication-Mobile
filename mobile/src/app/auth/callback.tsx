import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { LoadingScreen } from '@/components/auth/loading-screen';
import { GoogleSignInError, handleAuthCallbackUrl } from '@/lib/auth/google-sign-in';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const url = Linking.useURL();
  const handled = useRef(false);

  useEffect(() => {
    if (!url || handled.current) {
      return;
    }

    handled.current = true;

    void handleAuthCallbackUrl(url).catch((error) => {
      const code = error instanceof GoogleSignInError && error.code === 'domain' ? 'domain' : 'auth';
      router.replace(`/(auth)/login?error=${code}`);
    });
  }, [router, url]);

  return <LoadingScreen dark />;
}
