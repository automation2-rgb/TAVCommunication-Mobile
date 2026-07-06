import { Redirect } from 'expo-router';

import { LoadingScreen } from '@/components/auth/loading-screen';
import { useAuth } from '@/lib/auth/auth-provider';
import { resolveAuthHref, toHref } from '@/lib/auth/routing';

export default function IndexScreen() {
  const { isLoading, session, profile } = useAuth();

  if (isLoading) {
    return <LoadingScreen dark />;
  }

  return <Redirect href={toHref(resolveAuthHref(session, profile))} />;
}
