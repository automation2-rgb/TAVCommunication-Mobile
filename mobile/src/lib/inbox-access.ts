import { apiFetch } from '@/lib/api-client';

export type InboxAccessCatalogItem = {
  slug: string;
  displayName: string;
  assigned: boolean;
  requested: boolean;
};

export async function fetchInboxAccessCatalog(): Promise<InboxAccessCatalogItem[]> {
  const response = await apiFetch('/api/inbox-access/catalog');

  if (!response.ok) {
    throw new Error('Unable to load inbox catalog.');
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const rows = record.inboxes ?? record.catalog ?? record.data;
      if (Array.isArray(rows)) {
        return normalizeCatalog(rows);
      }
    }
    return [];
  }

  return normalizeCatalog(payload);
}

function normalizeCatalog(rows: unknown[]): InboxAccessCatalogItem[] {
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      const record = row as Record<string, unknown>;
      const slug = String(record.slug ?? record.inbox_slug ?? '');
      if (!slug) {
        return null;
      }
      return {
        slug,
        displayName: String(record.displayName ?? record.display_name ?? slug),
        assigned: Boolean(record.assigned ?? record.is_assigned),
        requested: Boolean(record.requested ?? record.is_requested),
      };
    })
    .filter((item): item is InboxAccessCatalogItem => item != null);
}

export async function requestInboxAccess(slugs: string[]) {
  const response = await apiFetch('/api/inbox-access/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inboxSlugs: slugs }),
  });

  if (!response.ok) {
    let message = 'Unable to submit inbox access request.';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
}
