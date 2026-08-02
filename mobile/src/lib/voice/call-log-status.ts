import type { CallLogStatus } from '@/types/voice';
import { tavColors } from '@/lib/theme';

const MISSED_STATUSES = new Set<CallLogStatus>(['missed', 'no-answer', 'busy']);

export function isMissedInboundStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return MISSED_STATUSES.has(status as CallLogStatus);
}

export function formatCallStatusLabel(status: string | null | undefined): string {
  if (!status) {
    return 'Unknown';
  }

  switch (status) {
    case 'in-progress':
      return 'In progress';
    case 'no-answer':
      return 'No answer';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function callStatusColors(status: string | null | undefined, direction: string): {
  backgroundColor: string;
  color: string;
} {
  if (direction === 'inbound' && isMissedInboundStatus(status)) {
    return { backgroundColor: tavColors.amber50, color: tavColors.amber600 };
  }

  switch (status) {
    case 'completed':
      return { backgroundColor: tavColors.emerald50, color: tavColors.emerald600 };
    case 'failed':
      return { backgroundColor: tavColors.red50, color: tavColors.red600 };
    case 'in-progress':
    case 'ringing':
      return { backgroundColor: tavColors.zinc100, color: tavColors.zinc700 };
    default:
      return { backgroundColor: tavColors.zinc100, color: tavColors.zinc600 };
  }
}
