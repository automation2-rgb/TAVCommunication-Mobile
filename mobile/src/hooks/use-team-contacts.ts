import { useCallback, useEffect, useState } from 'react';

import { searchTeamProfiles } from '@/lib/messaging/contacts';
import type { ContactDirectoryRow } from '@/types/messaging';

/** Browse or search approved teammates (profiles). Empty query = full list. */
export function useTeamContacts(query: string, enabled = true) {
  const [contacts, setContacts] = useState<ContactDirectoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rows = await searchTeamProfiles(query);
      setContacts(rows);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load team contacts.'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, query]);

  useEffect(() => {
    if (!enabled) {
      setContacts([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      void searchTeamProfiles(query)
        .then((rows) => {
          if (!cancelled) {
            setContacts(rows);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err : new Error('Unable to load team contacts.'));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    }, query.trim().length > 0 ? 250 : 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, query]);

  return { contacts, isLoading, error, refresh };
}
