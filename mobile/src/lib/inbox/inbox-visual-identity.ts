import type { LucideIcon } from '@/components/icons/lucide';
import {
  Briefcase,
  Building2,
  Inbox,
  Mail,
  MessageSquare,
  MessagesSquare,
  Phone,
  Smartphone,
} from '@/components/icons/lucide';

import { hashIndex } from '@/lib/hash/string-hash';

export type InboxVisualStyle = {
  backgroundColor: string;
  iconColor: string;
  Icon: LucideIcon;
};

const INBOX_SWATCHES: Array<{ backgroundColor: string; iconColor: string }> = [
  { backgroundColor: '#dbeafe', iconColor: '#1d4ed8' },
  { backgroundColor: '#d1fae5', iconColor: '#047857' },
  { backgroundColor: '#ede9fe', iconColor: '#6d28d9' },
  { backgroundColor: '#fef3c7', iconColor: '#92400e' },
  { backgroundColor: '#ffe4e6', iconColor: '#be123c' },
  { backgroundColor: '#cffafe', iconColor: '#155e75' },
  { backgroundColor: '#e0e7ff', iconColor: '#4338ca' },
  { backgroundColor: '#ccfbf1', iconColor: '#115e59' },
];

const INBOX_ICONS: LucideIcon[] = [
  Inbox,
  Mail,
  MessageSquare,
  MessagesSquare,
  Phone,
  Smartphone,
  Building2,
  Briefcase,
];

export function getInboxVisualIdentity(inboxId: string): InboxVisualStyle {
  const index = hashIndex(inboxId, INBOX_SWATCHES.length);
  const swatch = INBOX_SWATCHES[index] ?? INBOX_SWATCHES[0];
  const Icon = INBOX_ICONS[index] ?? Inbox;

  return {
    backgroundColor: swatch.backgroundColor,
    iconColor: swatch.iconColor,
    Icon,
  };
}
