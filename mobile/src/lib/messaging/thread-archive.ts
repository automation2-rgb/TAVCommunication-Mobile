import { apiFetch } from '@/lib/api-client';

export async function markThreadDone(threadId: string) {
  const response = await apiFetch(`/api/threads/${threadId}/hide`, { method: 'POST' });

  if (!response.ok) {
    let message = 'Unable to mark this deal done.';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
}

export async function reopenThread(threadId: string) {
  const response = await apiFetch(`/api/threads/${threadId}/hide`, { method: 'DELETE' });

  if (!response.ok) {
    let message = 'Unable to reopen this deal.';
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
}
