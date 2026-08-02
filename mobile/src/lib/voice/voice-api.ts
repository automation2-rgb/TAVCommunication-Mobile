import { apiFetch } from '@/lib/api-client';
import type {
  VoiceConnectParams,
  VoiceOutboundResponse,
  VoiceTokenResponse,
} from '@/types/voice';

export class VoiceApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'VoiceApiError';
  }
}

async function parseJsonError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error?.trim()) {
      return body.error.trim();
    }
  } catch {
    // ignore parse failures
  }

  return `Request failed (${response.status})`;
}

export async function fetchVoiceToken(): Promise<VoiceTokenResponse> {
  const response = await apiFetch('/api/voice/token');

  if (!response.ok) {
    throw new VoiceApiError(await parseJsonError(response), response.status);
  }

  return (await response.json()) as VoiceTokenResponse;
}

export type VoiceOutboundRequest = {
  thread_id: string;
  inbox_id?: string;
  customer_e164?: string;
};

export async function fetchVoiceOutbound(
  payload: VoiceOutboundRequest,
): Promise<VoiceConnectParams> {
  const response = await apiFetch('/api/voice/outbound', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new VoiceApiError(await parseJsonError(response), response.status);
  }

  const body = (await response.json()) as VoiceOutboundResponse;
  return body.connectParams;
}
