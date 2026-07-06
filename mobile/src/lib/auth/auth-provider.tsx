import { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setRealtimeAuth, supabase } from '@/lib/supabase';
import type { Profile } from '@/types/profile';

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) {
    throw error;
  }
  return data as Profile | null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    if (!session?.user.id) {
      setProfile(null);
      return;
    }

    const nextProfile = await fetchProfile(session.user.id);
    setProfile(nextProfile);
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      setSession(data.session);
      await setRealtimeAuth(data.session?.access_token ?? null);

      if (data.session?.user.id) {
        try {
          const nextProfile = await fetchProfile(data.session.user.id);
          if (mounted) {
            setProfile(nextProfile);
          }
        } catch {
          if (mounted) {
            setProfile(null);
          }
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    void loadInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await setRealtimeAuth(nextSession?.access_token ?? null);

      if (!nextSession?.user.id) {
        setProfile(null);
        return;
      }

      try {
        const nextProfile = await fetchProfile(nextSession.user.id);
        setProfile(nextProfile);
      } catch {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      profile,
      isLoading,
      refreshProfile,
    }),
    [session, profile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
