import { supabase } from '@/lib/supabase';
import type { ContactDirectoryKind, ContactDirectoryRow } from '@/types/messaging';

export type ContactsDirectoryCursor = {
  afterPhone: string;
  afterId: string;
};

export type ListContactsPageParams = {
  kind: ContactDirectoryKind;
  limit?: number;
  cursor?: ContactsDirectoryCursor | null;
};

export type ListContactsPageResult = {
  contacts: ContactDirectoryRow[];
  nextCursor: ContactsDirectoryCursor | null;
};

const DEFAULT_PAGE_SIZE = 50;

export function toContactsError(error: unknown, fallback: string): Error {
  if (error instanceof Error) {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return new Error(message.trim());
    }
  }

  return new Error(fallback);
}

function mapContactRow(value: unknown): ContactDirectoryRow | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.phone_e164 !== 'string') {
    return null;
  }

  const tagsRaw = row.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((tag): tag is string => typeof tag === 'string')
    : null;

  return {
    id: row.id,
    phone_e164: row.phone_e164,
    display_name: typeof row.display_name === 'string' ? row.display_name : null,
    notes: typeof row.notes === 'string' ? row.notes : null,
    tags,
    source: typeof row.source === 'string' ? row.source : null,
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

function normalizeContactRows(payload: unknown): ContactDirectoryRow[] {
  if (Array.isArray(payload)) {
    return payload
      .map(mapContactRow)
      .filter((row): row is ContactDirectoryRow => row !== null);
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const rows = record.contacts ?? record.rows ?? record.data;
    if (Array.isArray(rows)) {
      return rows
        .map(mapContactRow)
        .filter((row): row is ContactDirectoryRow => row !== null);
    }
  }

  return [];
}

function buildNextCursor(
  contacts: ContactDirectoryRow[],
  pageSize: number,
): ContactsDirectoryCursor | null {
  if (contacts.length < pageSize) {
    return null;
  }

  const last = contacts[contacts.length - 1];
  if (!last?.phone_e164 || !last.id) {
    return null;
  }

  return {
    afterPhone: last.phone_e164,
    afterId: last.id,
  };
}

export async function listContactsDirectoryPage(
  params: ListContactsPageParams,
): Promise<ListContactsPageResult> {
  if (params.kind !== 'external') {
    return { contacts: [], nextCursor: null };
  }

  const pageSize = params.limit ?? DEFAULT_PAGE_SIZE;
  const { data, error } = await supabase.rpc('list_contacts_directory_page', {
    p_after_phone: params.cursor?.afterPhone ?? null,
    p_after_id: params.cursor?.afterId ?? null,
    p_limit: pageSize,
  });

  if (error) {
    throw error;
  }

  const contacts = normalizeContactRows(data);
  return {
    contacts,
    nextCursor: buildNextCursor(contacts, pageSize),
  };
}

export async function queryContactsDirectory(query: string, limit = 500): Promise<ContactDirectoryRow[]> {
  const { data, error } = await supabase.rpc('search_contacts_for_directory', {
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
    .select('id, email, display_name, phone_e164, avatar_storage_path, role, created_at')
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
    avatar_storage_path: profile.avatar_storage_path ?? null,
    notes: null,
    tags: profile.role ? [profile.role] : null,
    source: 'team',
    updated_at: profile.created_at ?? null,
  }));
}
