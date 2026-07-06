import { useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/lib/auth/auth-provider';
import { getAuthScreen, isAppRoute, isAuthRoute, resolveAuthHref, toHref } from '@/lib/auth/routing';

function getCurrentGroup(segments: string[]) {
  if (segments[0] === '(auth)' || segments[0] === '(app)') {
    return segments[0];
  }

  return null;
}

function getCurrentAuthScreen(segments: string[]) {
  if (segments[0] !== '(auth)') {
    return null;
  }

  return segments[1] ?? null;
}

export function useAuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { session, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading || !navigationState?.key) {
      return;
    }

    if (segments[0] === 'auth' && segments[1] === 'callback') {
      return;
    }

    const destination = resolveAuthHref(session, profile);
    const currentGroup = getCurrentGroup(segments);
    const currentAuthScreen = getCurrentAuthScreen(segments);

    if (isAppRoute(destination)) {
      if (currentGroup !== '(app)') {
        router.replace(toHref(destination));
      }
      return;
    }

    if (isAuthRoute(destination)) {
      const targetScreen = getAuthScreen(destination);

      if (currentGroup !== '(auth)' || currentAuthScreen !== targetScreen) {
        router.replace(toHref(destination));
      }
    }
  }, [isLoading, navigationState?.key, profile, router, segments, session]);
}
