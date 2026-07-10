import { useEffect, useMemo, useState } from 'react';

import {
  fetchAttachmentsForMessages,
  groupAttachmentsByMessageId,
} from '@/lib/messaging/message-attachments';
import type { MessageAttachment } from '@/types/messaging';

export function useMessageAttachments(messageIds: string[]) {
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(messageIds.length > 0);
  const [error, setError] = useState<Error | null>(null);

  const stableKey = useMemo(() => messageIds.join(','), [messageIds]);

  useEffect(() => {
    if (messageIds.length === 0) {
      setAttachments([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void fetchAttachmentsForMessages(messageIds)
      .then((rows) => {
        if (!cancelled) {
          setAttachments(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unable to load attachments.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stableKey, messageIds]);

  const byMessageId = useMemo(() => groupAttachmentsByMessageId(attachments), [attachments]);

  return {
    attachments,
    byMessageId,
    isLoading,
    error,
  };
}
