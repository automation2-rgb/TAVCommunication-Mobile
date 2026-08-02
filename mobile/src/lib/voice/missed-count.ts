import { apiFetch } from '@/lib/api-client';
import type { MissedCountResponse } from '@/types/voice';

export async function fetchMissedCallCount(since?: string | null): Promise<MissedCountResponse> {
  const query = since ? `?since=${encodeURIComponent(since)}` : '';
  const response = await apiFetch(`/api/dev-console/voice-pilot/missed-count${query}`);

  if (!response.ok) {
    throw new Error(`Missed call count failed (${response.status})`);
  }

  return (await response.json()) as MissedCountResponse;
}
