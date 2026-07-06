import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { env } from '@/lib/env';

function createAuthStorage() {
  if (Platform.OS === 'web') {
    return {
      getItem: async (key: string) => {
        if (typeof localStorage === 'undefined') {
          return null;
        }
        return localStorage.getItem(key);
      },
      setItem: async (key: string, value: string) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      },
    };
  }

  const SecureStore = require('expo-secure-store') as typeof import('expo-secure-store');

  return {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
}

const authStorage = createAuthStorage();

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function setRealtimeAuth(accessToken: string | null) {
  if (accessToken) {
    await supabase.realtime.setAuth(accessToken);
    return;
  }

  await supabase.realtime.setAuth(null);
}
