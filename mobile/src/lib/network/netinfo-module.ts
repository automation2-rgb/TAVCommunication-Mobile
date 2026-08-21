export type ConnectivitySnapshot = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

type NetInfoModule = {
  fetch: () => Promise<ConnectivitySnapshot>;
  addEventListener: (listener: (state: ConnectivitySnapshot) => void) => () => void;
};

/** Load NetInfo only when the native module is linked in the current dev build. */
export function loadNetInfoModule(): NetInfoModule | null {
  const { NativeModules } = require('react-native') as typeof import('react-native');

  if (!NativeModules.RNCNetInfo) {
    return null;
  }

  try {
    const module = require('@react-native-community/netinfo') as { default: NetInfoModule };
    return module.default;
  } catch {
    return null;
  }
}
