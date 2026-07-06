import { supabase } from '@/lib/supabase';

export async function updateThreadDisplayName(threadId: string, displayName: string | null) {
  const { error } = await supabase
    .from('threads')
    .update({ display_name: displayName?.trim() || null })
    .eq('id', threadId);

  if (error) {
    throw error;
  }
}
