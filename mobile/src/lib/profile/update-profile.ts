import { supabase } from '@/lib/supabase';
import { isValidE164Phone } from '@/lib/phone/e164';
import type { Profile } from '@/types/profile';

export type UpdateOwnProfileInput = {
  displayName: string;
  phoneE164: string;
};

export async function updateOwnProfile(input: UpdateOwnProfileInput): Promise<Profile> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const userId = session?.user.id;
  if (!userId) {
    throw new Error('You must be signed in to update your profile.');
  }

  const displayName = input.displayName.trim() || null;
  const phoneRaw = input.phoneE164.trim();
  const phoneE164 = phoneRaw.length > 0 ? phoneRaw : null;

  if (phoneE164 && !isValidE164Phone(phoneE164)) {
    throw new Error('Enter a valid phone number in E.164 format, such as +15551234567.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      phone_e164: phoneE164,
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}
