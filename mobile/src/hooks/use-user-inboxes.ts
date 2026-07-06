import { useCallback, useEffect, useState } from 'react';

import { fetchUserInboxes } from '@/lib/messaging/inboxes';
import type { Inbox } from '@/types/messaging';

export function useUserInboxes(userId: string | undefined) {
  const [inboxes, setInboxes] = useState<Inbox[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setInboxes([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const next = await fetchUserInboxes(userId);
      setInboxes(next);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unable to load inboxes.'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { inboxes, isLoading, error, refresh };
}
