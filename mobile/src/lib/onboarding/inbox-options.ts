export type OnboardingInboxOption = {
  slug: string;
  displayName: string;
};

export const STATIC_ONBOARDING_INBOX_OPTIONS: OnboardingInboxOption[] = [
  { slug: 'wires-only-only', displayName: 'Wires Only Only' },
  { slug: 'inspection-approval', displayName: 'Inspection Approval' },
  { slug: 'titles-collections', displayName: 'Titles & Collections' },
  { slug: 'scheduling', displayName: 'Scheduling' },
  { slug: 'wires-accounting', displayName: 'Wires & Accounting' },
  { slug: 'transporter-scheduling', displayName: 'Transporter Scheduling' },
  { slug: 'inventory-control', displayName: 'Inventory Control' },
  { slug: 'transportation-qa', displayName: 'Transportation QA' },
];

function normalizeInboxOption(value: unknown): OnboardingInboxOption | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const slug = typeof record.slug === 'string' ? record.slug : null;
  const displayName =
    typeof record.displayName === 'string'
      ? record.displayName
      : typeof record.display_name === 'string'
        ? record.display_name
        : typeof record.name === 'string'
          ? record.name
          : null;

  if (!slug || !displayName) {
    return null;
  }

  return { slug, displayName };
}

export function parseOnboardingInboxResponse(payload: unknown): OnboardingInboxOption[] {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? (((payload as Record<string, unknown>).inboxes ??
          (payload as Record<string, unknown>).items ??
          (payload as Record<string, unknown>).data) as unknown)
      : null;

  if (!Array.isArray(candidates)) {
    return STATIC_ONBOARDING_INBOX_OPTIONS;
  }

  const parsed = candidates
    .map(normalizeInboxOption)
    .filter((option): option is OnboardingInboxOption => option !== null);

  return parsed.length > 0 ? parsed : STATIC_ONBOARDING_INBOX_OPTIONS;
}
