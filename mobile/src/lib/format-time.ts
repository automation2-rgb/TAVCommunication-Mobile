export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 60_000) {
    return 'Now';
  }

  if (diffMs < 3_600_000) {
    return `${Math.floor(diffMs / 60_000)}m`;
  }

  if (diffMs < 86_400_000) {
    return `${Math.floor(diffMs / 3_600_000)}h`;
  }

  if (diffMs < 604_800_000) {
    return `${Math.floor(diffMs / 86_400_000)}d`;
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
