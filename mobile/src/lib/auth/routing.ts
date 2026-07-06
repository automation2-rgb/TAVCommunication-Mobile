import type { Session } from '@supabase/supabase-js';
import type { Href } from 'expo-router';

import type { Profile } from '@/types/profile';

export type AuthRoute =
  | '/(auth)/login'
  | '/(auth)/onboarding'
  | '/(auth)/pending'
  | '/(auth)/rejected'
  | '/(app)/inbox';

export function resolveAuthHref(session: Session | null, profile: Profile | null): AuthRoute {
  if (!session) {
    return '/(auth)/login';
  }

  if (!profile) {
    return '/(auth)/login';
  }

  switch (profile.approval_status) {
    case 'rejected':
      return '/(auth)/rejected';
    case 'pending':
      return profile.onboarding_submitted_at ? '/(auth)/pending' : '/(auth)/onboarding';
    case 'approved':
      return '/(app)/inbox';
    default:
      return '/(auth)/login';
  }
}

export function toHref(route: AuthRoute): Href {
  return route as Href;
}

export function isAuthRoute(route: AuthRoute): boolean {
  return route.startsWith('/(auth)');
}

export function isAppRoute(route: AuthRoute): boolean {
  return route.startsWith('/(app)');
}

export function getAuthScreen(route: AuthRoute): string | null {
  if (!isAuthRoute(route)) {
    return null;
  }

  return route.replace('/(auth)/', '');
}
