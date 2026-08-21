const PROBE_TIMEOUT_MS = 4000;
const PROBE_URL = 'https://clients3.google.com/generate_204';

export async function probeInternetReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, PROBE_TIMEOUT_MS);

    const response = await fetch(PROBE_URL, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
}

export function snapshotFromProbe(reachable: boolean): {
  isConnected: boolean;
  isInternetReachable: boolean;
} {
  return {
    isConnected: reachable,
    isInternetReachable: reachable,
  };
}
