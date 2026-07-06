const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://tav-communication.vercel.app',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
};

/** Supabase project ref (e.g. wiacdfruipunzfffgyfy) */
export const supabaseProjectRef = new URL(env.supabaseUrl).hostname.split('.')[0];
