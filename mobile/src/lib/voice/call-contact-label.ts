import { formatE164AsUsDisplay } from '@/lib/phone/us-keypad';
import type { CallLog } from '@/types/voice';

export function getCallContactLabel(call: CallLog): string {
  if (call.contact_display_name?.trim()) {
    return call.contact_display_name.trim();
  }

  return formatE164AsUsDisplay(call.customer_e164);
}

export function getCallDirectionLabel(call: CallLog, missed: boolean): string {
  if (missed) {
    return 'Missed';
  }

  return call.direction === 'inbound' ? 'Incoming' : 'Outgoing';
}
