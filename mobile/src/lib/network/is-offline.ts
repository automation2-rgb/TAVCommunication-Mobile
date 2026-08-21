import type { ConnectivitySnapshot } from '@/lib/network/netinfo-module';

export function isOfflineNetInfoState(state: ConnectivitySnapshot): boolean {
  if (state.isConnected === false) {
    return true;
  }

  if (state.isInternetReachable === false) {
    return true;
  }

  return false;
}
