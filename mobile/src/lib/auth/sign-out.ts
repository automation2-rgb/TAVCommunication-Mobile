import { getCachedDevicePushToken, unregisterDevicePushToken } from '@/lib/push/notifications';
import { supabase } from '@/lib/supabase';

export async function signOut() {
  try {
    await unregisterDevicePushToken(getCachedDevicePushToken());
  } catch {
    // Best-effort cleanup; session sign-out still proceeds.
  }

  await supabase.auth.signOut();
}
