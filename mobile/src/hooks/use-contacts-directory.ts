import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/auth-provider';
import {
  listContactsDirectoryPage,
  queryContactsDirectory,
  toContactsError,
  type ContactsDirectoryCursor,
} from '@/lib/messaging/contacts';
import type { ContactDirectoryKind, ContactDirectoryRow } from '@/types/messaging';

export function useContactsDirectory(params: { kind: ContactDirectoryKind; enabled?: boolean }) {
  const { session, isLoading: authLoading } = useAuth();
  const { kind, enabled = true } = params;
  const fetchEnabled = enabled && !authLoading && Boolean(session);

  const [contacts, setContacts] = useState<ContactDirectoryRow[]>([]);
  const [nextCursor, setNextCursor] = useState<ContactsDirectoryCursor | null>(null);
  const [isLoading, setIsLoading] = useState(fetchEnabled);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!fetchEnabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const page = await listContactsDirectoryPage({ kind, cursor: null });
      setContacts(page.contacts);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(toContactsError(err, 'Unable to load contacts.'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchEnabled, kind]);

  const loadMore = useCallback(async () => {
    if (!fetchEnabled || !nextCursor || isLoadingMore) {
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
      setError(toContactsError(err, 'Unable to load more contacts.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchEnabled, isLoadingMore, kind, nextCursor]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!session) {
      setContacts([]);
      setNextCursor(null);
      setIsLoading(false);
      setError(new Error('Sign in required to load contacts.'));
      return;
    }

    void refresh();
  }, [authLoading, enabled, refresh, session]);

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
  const { session, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<ContactDirectoryRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    const fetchEnabled = enabled && !authLoading && Boolean(session);

    if (!fetchEnabled || trimmed.length === 0) {
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
            setError(toContactsError(err, 'Unable to search contacts.'));
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
  }, [authLoading, enabled, query, session]);

  return { results, isSearching, error };
}
