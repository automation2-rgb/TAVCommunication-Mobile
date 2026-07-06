import { apiFetch } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

export async function signOut() {
  try {
    await apiFetch('/api/push/register', { method: 'DELETE' });
  } catch {
    // Push unregister is optional until Phase 7 backend exists.
  }

  await supabase.auth.signOut();
}
