import { useCallback, useEffect, useState } from 'react';

import { listContactsDirectoryPage, queryContactsDirectory } from '@/lib/messaging/contacts';
import type { ContactDirectoryKind, ContactDirectoryRow } from '@/types/messaging';

export function useContactsDirectory(params: { kind: ContactDirectoryKind; enabled?: boolean }) {
  const { kind, enabled = true } = params;
  const [contacts, setContacts] = useState<ContactDirectoryRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const page = await listContactsDirectoryPage({ kind, cursor: null });
      setContacts(page.contacts);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load contacts.'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, kind]);

  const loadMore = useCallback(async () => {
    if (!enabled || !nextCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const page = await listContactsDirectoryPage({ kind, cursor: nextCursor });
      setContacts((current) => {
        const byPhone = new Map(current.map((contact) => [contact.phone_e164, contact]));
        for (const contact of page.contacts) {
          byPhone.set(contact.phone_e164, contact);
        }
        return [...byPhone.values()];
      });
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load more contacts.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [enabled, isLoadingMore, kind, nextCursor]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    contacts,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    refresh,
    loadMore,
  };
}

export function useContactsSearch(query: string, enabled = true) {
  const [results, setResults] = useState<ContactDirectoryRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || trimmed.length === 0) {
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setError(null);

    const timer = setTimeout(() => {
      void queryContactsDirectory(trimmed)
        .then((rows) => {
          if (!cancelled) {
            setResults(rows);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err : new Error('Unable to search contacts.'));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, query]);

  return { results, isSearching, error };
}
