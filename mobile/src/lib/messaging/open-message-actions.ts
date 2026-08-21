import * as Clipboard from 'expo-clipboard';
import { Alert } from 'react-native';

import { isValidE164Phone } from '@/lib/phone/e164';
import { formatE164AsUsDisplay } from '@/lib/phone/us-keypad';
import type { Message } from '@/types/messaging';

export type MessageActionContext = {
  message: Message;
  threadCustomerE164: string | null | undefined;
  voiceEnabled: boolean;
};

export function resolveMessagePhoneE164(
  message: Message,
  threadCustomerE164: string | null | undefined,
): string {
  if (message.direction === 'inbound') {
    return message.sender_e164?.trim() || threadCustomerE164?.trim() || '';
  }

  return threadCustomerE164?.trim() || '';
}

export function getMessageActionAvailability(context: MessageActionContext) {
  const body = context.message.body?.trim() ?? '';
  const phoneE164 = resolveMessagePhoneE164(context.message, context.threadCustomerE164);
  const hasPhone = isValidE164Phone(phoneE164);
  const canCall = context.voiceEnabled && hasPhone;

  return {
    body,
    phoneE164: hasPhone ? phoneE164 : null,
    canCopyText: body.length > 0,
    canCopyPhone: hasPhone,
    canCall,
    hasAnyAction: body.length > 0 || hasPhone,
  };
}

async function copyToClipboard(text: string) {
  await Clipboard.setStringAsync(text);
}

export function openMessageActions(
  context: MessageActionContext,
  handlers: {
    onCall?: (phoneE164: string) => void | Promise<void>;
  } = {},
) {
  const availability = getMessageActionAvailability(context);
  if (!availability.hasAnyAction) {
    return;
  }

  const actions: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [];

  if (availability.canCopyText) {
    actions.push({
      text: 'Copy message',
      onPress: () => {
        void copyToClipboard(availability.body);
      },
    });
  }

  if (availability.canCopyPhone && availability.phoneE164) {
    actions.push({
      text: 'Copy phone number',
      onPress: () => {
        void copyToClipboard(availability.phoneE164!);
      },
    });
  }

  if (availability.canCall && availability.phoneE164) {
    actions.push({
      text: 'Call this number',
      onPress: () => {
        void handlers.onCall?.(availability.phoneE164!);
      },
    });
  }

  actions.push({ text: 'Cancel', style: 'cancel' });

  const title = availability.canCopyText
    ? availability.body.length > 80
      ? `${availability.body.slice(0, 80)}…`
      : availability.body
    : availability.phoneE164
      ? formatE164AsUsDisplay(availability.phoneE164)
      : 'Message';

  Alert.alert(title, undefined, actions);
}
