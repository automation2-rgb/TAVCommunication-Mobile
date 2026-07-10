import { supabase } from '@/lib/supabase';
import type { ContactDirectoryKind, ContactDirectoryRow } from '@/types/messaging';

export type ListContactsPageParams = {
  kind: ContactDirectoryKind;
  limit?: number;
  cursor?: string | null;
};

export type ListContactsPageResult = {
  contacts: ContactDirectoryRow[];
  nextCursor: string | null;
};

function normalizeContactRows(payload: unknown): ContactDirectoryRow[] {
  if (Array.isArray(payload)) {
    return payload as ContactDirectoryRow[];
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const rows = record.contacts ?? record.rows ?? record.data;
    if (Array.isArray(rows)) {
      return rows as ContactDirectoryRow[];
    }
  }

  return [];
}

function normalizeNextCursor(payload: unknown, contacts: ContactDirectoryRow[]): string | null {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const cursor = record.next_cursor ?? record.nextCursor;
    if (typeof cursor === 'string' && cursor.length > 0) {
      return cursor;
    }
  }

  const last = contacts[contacts.length - 1];
  return last?.updated_at ?? last?.phone_e164 ?? null;
}

export async function listContactsDirectoryPage(
  params: ListContactsPageParams,
): Promise<ListContactsPageResult> {
  const rpcArgs = {
    p_kind: params.kind,
    p_limit: params.limit ?? 50,
    p_cursor: params.cursor ?? null,
  };

  const { data, error } = await supabase.rpc('list_contacts_directory_page', rpcArgs);

  if (error) {
    throw error;
  }

  const contacts = normalizeContactRows(data);
  return {
    contacts,
    nextCursor: normalizeNextCursor(data, contacts),
  };
}

export async function queryContactsDirectory(query: string, limit = 500): Promise<ContactDirectoryRow[]> {
  const { data, error } = await supabase.rpc('query_contacts_directory', {
    p_query: query,
    p_limit: limit,
  });

  if (error) {
    throw error;
  }

  return normalizeContactRows(data);
}

export async function searchTeamProfiles(query: string): Promise<ContactDirectoryRow[]> {
  const trimmed = query.trim();
  let request = supabase
    .from('profiles')
    .select('id, email, display_name, phone_e164, role, created_at')
    .eq('approval_status', 'approved')
    .order('display_name', { ascending: true })
    .limit(500);

  if (trimmed) {
    request = request.or(`display_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone_e164.ilike.%${trimmed}%`);
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    phone_e164: profile.phone_e164 ?? '',
    display_name: profile.display_name ?? profile.email,
    notes: null,
    tags: profile.role ? [profile.role] : null,
    source: 'team',
    updated_at: profile.created_at ?? null,
  }));
}
