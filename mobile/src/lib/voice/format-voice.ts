const TOKEN_REFRESH_BUFFER_SECONDS = 120;

export function computeTokenExpiryMs(expiresInSeconds: number, nowMs = Date.now()): number {
  return nowMs + expiresInSeconds * 1000;
}

export function shouldRefreshVoiceToken(expiresAtMs: number | null, nowMs = Date.now()): boolean {
  if (!expiresAtMs) {
    return true;
  }

  return nowMs >= expiresAtMs - TOKEN_REFRESH_BUFFER_SECONDS * 1000;
}

export function formatVoiceElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatCallDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) {
    return '—';
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}
