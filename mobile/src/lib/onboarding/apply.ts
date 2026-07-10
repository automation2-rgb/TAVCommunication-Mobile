import { apiFetch } from '@/lib/api-client';
import {
  parseOnboardingInboxResponse,
  STATIC_ONBOARDING_INBOX_OPTIONS,
  type OnboardingInboxOption,
} from '@/lib/onboarding/inbox-options';

export type OnboardingApplyPayload = {
  firstName: string;
  lastName: string;
  phoneE164: string;
  inboxSlugs: string[];
};

export async function fetchOnboardingInboxes(): Promise<OnboardingInboxOption[]> {
  try {
    const response = await apiFetch('/api/onboarding/inboxes');
    if (!response.ok) {
      return STATIC_ONBOARDING_INBOX_OPTIONS;
    }

    const payload = (await response.json()) as unknown;
    return parseOnboardingInboxResponse(payload);
  } catch {
    return STATIC_ONBOARDING_INBOX_OPTIONS;
  }
}

export async function submitOnboardingApplication(payload: OnboardingApplyPayload) {
  const response = await apiFetch('/api/onboarding/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    return;
  }

  let message = 'Unable to submit your application.';
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    message = body.error ?? body.message ?? message;
  } catch {
    // Keep default message when response is not JSON.
  }

  throw new Error(message);
}

export { isValidE164Phone } from '@/lib/phone/e164';
