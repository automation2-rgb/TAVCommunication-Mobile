import { isValidE164Phone } from '@/lib/phone/e164';
import { resolveDirectThreadForPhone } from '@/lib/voice/resolve-call-target';

type PlaceVoiceCallParams = {
  inboxId: string;
  phoneE164: string;
  contactLabel?: string;
  ensureReady: () => Promise<void>;
  placeOutboundCall: (request: {
    threadId: string;
    inboxId: string;
    customerE164: string;
    contactLabel?: string;
  }) => Promise<void>;
};

export async function placeVoiceCallToNumber({
  inboxId,
  phoneE164,
  contactLabel,
  ensureReady,
  placeOutboundCall,
}: PlaceVoiceCallParams): Promise<void> {
  const normalized = phoneE164.trim();
  if (!isValidE164Phone(normalized)) {
    throw new Error('Invalid phone number.');
  }

  const threadId = await resolveDirectThreadForPhone(inboxId, normalized);
  await ensureReady();
  await placeOutboundCall({
    threadId,
    inboxId,
    customerE164: normalized,
    contactLabel: contactLabel?.trim() || normalized,
  });
}
