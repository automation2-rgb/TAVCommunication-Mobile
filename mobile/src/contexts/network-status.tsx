import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { probeInternetReachable, snapshotFromProbe } from '@/lib/network/fetch-connectivity';
import { isOfflineNetInfoState } from '@/lib/network/is-offline';
import { loadNetInfoModule, type ConnectivitySnapshot } from '@/lib/network/netinfo-module';

type NetworkStatusContextValue = {
  isOffline: boolean;
  isReady: boolean;
  usesNativeNetInfo: boolean;
};

const NetworkStatusContext = createContext<NetworkStatusContextValue | null>(null);

const FALLBACK_PROBE_MS = 30_000;

function resolveOffline(state: ConnectivitySnapshot | null): boolean {
  if (!state) {
    return false;
  }

  return isOfflineNetInfoState(state);
}

async function probeAndSet(setNetInfo: (state: ConnectivitySnapshot) => void) {
  const reachable = await probeInternetReachable();
  setNetInfo(snapshotFromProbe(reachable));
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [netInfo, setNetInfo] = useState<ConnectivitySnapshot | null>(null);
  const [usesNativeNetInfo, setUsesNativeNetInfo] = useState(false);

  useEffect(() => {
    const netInfoModule = loadNetInfoModule();

    if (netInfoModule) {
      setUsesNativeNetInfo(true);

      const unsubscribe = netInfoModule.addEventListener((state) => {
        setNetInfo(state);
      });

      void netInfoModule.fetch().then((state) => {
        setNetInfo(state);
      });

      return unsubscribe;
    }

    let cancelled = false;

    const runProbe = () => {
      void probeAndSet((state) => {
        if (!cancelled) {
          setNetInfo(state);
        }
      });
    };

    runProbe();

    const intervalId = setInterval(runProbe, FALLBACK_PROBE_MS);
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        runProbe();
      }
    });

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      appStateSubscription.remove();
    };
  }, []);

  const value = useMemo(
    () => ({
      isOffline: resolveOffline(netInfo),
      isReady: netInfo !== null,
      usesNativeNetInfo,
    }),
    [netInfo, usesNativeNetInfo],
  );

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>;
}

export function useNetworkStatus(): NetworkStatusContextValue {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within NetworkStatusProvider');
  }

  return context;
}
