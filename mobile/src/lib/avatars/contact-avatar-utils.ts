import { hashIndex } from '@/lib/hash/string-hash';

/** Tailwind 500-level palette — matches web ContactAvatar. */
export const CONTACT_AVATAR_COLORS = [
  '#3b82f6',
  '#10b981',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
  '#f43f5e',
  '#06b6d4',
  '#f59e0b',
  '#8b5cf6',
  '#d946ef',
] as const;

export function contactAvatarColor(seed: string): string {
  const index = hashIndex(seed, CONTACT_AVATAR_COLORS.length);
  return CONTACT_AVATAR_COLORS[index] ?? CONTACT_AVATAR_COLORS[0];
}

export function contactAvatarInitials(displayName: string | null | undefined, phoneE164: string | null | undefined): string {
  const name = displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length === 1) {
      return parts[0].toUpperCase();
    }
  }

  const digits = (phoneE164 ?? '').replace(/\D/g, '');
  if (digits.length >= 2) {
    return digits.slice(-2);
  }

  return '??';
}

export function contactAvatarSeed(displayName: string | null | undefined, phoneE164: string | null | undefined): string {
  const phone = phoneE164?.trim();
  if (phone) {
    return phone;
  }
  return displayName?.trim().toLowerCase() || 'unknown';
}

export function userAvatarInitials(displayName: string | null | undefined, email: string | null | undefined): string {
  const fromName = contactAvatarInitials(displayName, null);
  if (fromName !== '??') {
    return fromName;
  }
  const local = email?.split('@')[0]?.trim();
  if (local && local.length >= 2) {
    return local.slice(0, 2).toUpperCase();
  }
  return '??';
}
