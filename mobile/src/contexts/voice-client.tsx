import { Call, Voice } from '@twilio/voice-react-native-sdk';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { fetchVoiceOutbound, fetchVoiceToken, VoiceApiError } from '@/lib/voice/voice-api';
import { computeTokenExpiryMs, formatVoiceElapsed, shouldRefreshVoiceToken } from '@/lib/voice/format-voice';
import {
  ensureMicrophoneAccess,
  getMicrophoneAccessStatus,
  type MicrophoneAccess,
} from '@/lib/voice/microphone-permission';
import type { VoicePhase } from '@/types/voice';

type OutboundCallRequest = {
  threadId: string;
  inboxId: string;
  customerE164: string;
  contactLabel?: string;
};

type VoiceClientStateValue = {
  phase: VoicePhase;
  errorMessage: string | null;
  micAccess: MicrophoneAccess;
  isMuted: boolean;
  elapsedLabel: string;
  isBusy: boolean;
  activeContactLabel: string | null;
};

type VoiceClientActionsValue = {
  ensureReady: () => Promise<void>;
  placeOutboundCall: (request: OutboundCallRequest) => Promise<void>;
  hangUp: () => Promise<void>;
  toggleMute: () => Promise<void>;
  refreshMicAccess: () => Promise<void>;
};

type VoiceClientContextValue = VoiceClientStateValue & VoiceClientActionsValue;

const VoiceClientContext = createContext<VoiceClientContextValue | null>(null);
const VoiceClientActionsContext = createContext<VoiceClientActionsValue | null>(null);

let sharedVoice: Voice | null = null;

function getVoiceInstance(): Voice {
  if (!sharedVoice) {
    sharedVoice = new Voice();
  }

  return sharedVoice;
}

function mapVoiceError(error: unknown): string {
  if (error instanceof VoiceApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Voice call failed. Please try again.';
}

export function VoiceClientProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [phase, setPhase] = useState<VoicePhase>('uninitialized');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micAccess, setMicAccess] = useState<MicrophoneAccess>('denied');
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeContactLabel, setActiveContactLabel] = useState<string | null>(null);

  const tokenRef = useRef<string | null>(null);
  const tokenExpiresAtRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  const ensureReadyPromiseRef = useRef<Promise<void> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const detachCallListeners = useCallback((call: Call | null) => {
    if (!call) {
      return;
    }

    call.removeAllListeners();
  }, []);

  const resetCallState = useCallback(() => {
    detachCallListeners(activeCallRef.current);
    activeCallRef.current = null;
    connectedAtRef.current = null;
    setIsMuted(false);
    setElapsedSeconds(0);
    setActiveContactLabel(null);
    setPhase((current) => (current === 'error' ? current : 'ready'));
  }, [detachCallListeners]);

  const scheduleTokenRefresh = useCallback(() => {
    clearRefreshTimer();

    const expiresAt = tokenExpiresAtRef.current;
    if (!expiresAt) {
      return;
    }

    const delayMs = Math.max(1_000, expiresAt - Date.now() - 120_000);
    refreshTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const next = await fetchVoiceToken();
          tokenRef.current = next.token;
          tokenExpiresAtRef.current = computeTokenExpiryMs(next.expiresIn);
          scheduleTokenRefresh();
        } catch {
          setPhase('error');
          setErrorMessage('Voice session expired. Tap Call to reconnect.');
        }
      })();
    }, delayMs);
  }, [clearRefreshTimer]);

  const mintToken = useCallback(async () => {
    const next = await fetchVoiceToken();
    tokenRef.current = next.token;
    tokenExpiresAtRef.current = computeTokenExpiryMs(next.expiresIn);
    scheduleTokenRefresh();
  }, [scheduleTokenRefresh]);

  const ensureReady = useCallback(async () => {
    if (!enabled) {
      throw new Error('Voice is unavailable.');
    }

    if (ensureReadyPromiseRef.current) {
      return ensureReadyPromiseRef.current;
    }

    ensureReadyPromiseRef.current = (async () => {
      if (phase === 'connecting' || phase === 'in-call') {
        return;
      }

      setPhase('initializing');
      setErrorMessage(null);

      const mic = await ensureMicrophoneAccess();
      setMicAccess(mic);

      if (mic !== 'granted') {
        setPhase('error');
        setErrorMessage('Microphone access is required to place calls.');
        return;
      }

      if (!tokenRef.current || shouldRefreshVoiceToken(tokenExpiresAtRef.current)) {
        await mintToken();
      }

      setPhase('ready');
    })()
      .catch((error) => {
        setPhase('error');
        setErrorMessage(mapVoiceError(error));
      })
      .finally(() => {
        ensureReadyPromiseRef.current = null;
      });

    return ensureReadyPromiseRef.current;
  }, [enabled, mintToken, phase]);

  const bindCallListeners = useCallback(
    (call: Call) => {
      call.on(Call.Event.Ringing, () => {
        setPhase('connecting');
      });

      call.on(Call.Event.Connected, () => {
        connectedAtRef.current = Date.now();
        setPhase('in-call');
      });

      call.on(Call.Event.ConnectFailure, (error) => {
        setPhase('error');
        setErrorMessage(mapVoiceError(error));
        resetCallState();
      });

      call.on(Call.Event.Disconnected, () => {
        resetCallState();
      });
    },
    [resetCallState],
  );

  const placeOutboundCall = useCallback(
    async (request: OutboundCallRequest) => {
      if (activeCallRef.current || phase === 'connecting' || phase === 'in-call') {
        throw new Error('Already on a call');
      }

      await ensureReady();

      const mic = await getMicrophoneAccessStatus();
      setMicAccess(mic);
      if (mic !== 'granted') {
        throw new Error('Microphone access is required to place calls.');
      }

      if (!tokenRef.current || shouldRefreshVoiceToken(tokenExpiresAtRef.current)) {
        await mintToken();
      }

      const token = tokenRef.current;
      if (!token) {
        throw new Error('Unable to start voice session.');
      }

      setPhase('connecting');
      setErrorMessage(null);

      try {
        const connectParams = await fetchVoiceOutbound({
          thread_id: request.threadId,
          inbox_id: request.inboxId,
          customer_e164: request.customerE164,
        });

        const params: Record<string, string> = {
          To: connectParams.To,
          inboxId: connectParams.inboxId,
        };

        if (connectParams.threadId) {
          params.threadId = connectParams.threadId;
        }

        const label = request.contactLabel?.trim() || connectParams.To;
        setActiveContactLabel(label);
        const voice = getVoiceInstance();
        const call = await voice.connect(token, {
          params,
          contactHandle: label,
          notificationDisplayName: label,
        });

        activeCallRef.current = call;
        bindCallListeners(call);
      } catch (error) {
        setPhase('error');
        setErrorMessage(mapVoiceError(error));
        resetCallState();
        throw error;
      }
    },
    [bindCallListeners, ensureReady, mintToken, phase, resetCallState],
  );

  const hangUp = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) {
      resetCallState();
      return;
    }

    try {
      await call.disconnect();
    } finally {
      resetCallState();
    }
  }, [resetCallState]);

  const toggleMute = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) {
      return;
    }

    const nextMuted = !(call.isMuted() ?? isMuted);
    const applied = await call.mute(nextMuted);
    setIsMuted(applied);
  }, [isMuted]);

  const refreshMicAccess = useCallback(async () => {
    const next = await getMicrophoneAccessStatus();
    setMicAccess(next);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearRefreshTimer();
      tokenRef.current = null;
      tokenExpiresAtRef.current = null;
      void hangUp();
      setPhase('uninitialized');
      setErrorMessage(null);
      return;
    }

    void refreshMicAccess();
  }, [clearRefreshTimer, enabled, hangUp, refreshMicAccess]);

  useEffect(() => {
    if (phase !== 'in-call' || !connectedAtRef.current) {
      return;
    }

    const tick = () => {
      if (!connectedAtRef.current) {
        return;
      }

      setElapsedSeconds(Math.floor((Date.now() - connectedAtRef.current) / 1000));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshMicAccess();
      }
    });

    return () => subscription.remove();
  }, [enabled, refreshMicAccess]);

  useEffect(() => {
    return () => {
      clearRefreshTimer();
      void hangUp();
    };
  }, [clearRefreshTimer, hangUp]);

  const actionsRef = useRef<VoiceClientActionsValue>({
    ensureReady,
    placeOutboundCall,
    hangUp,
    toggleMute,
    refreshMicAccess,
  });
  actionsRef.current = {
    ensureReady,
    placeOutboundCall,
    hangUp,
    toggleMute,
    refreshMicAccess,
  };

  const stableActions = useMemo<VoiceClientActionsValue>(
    () => ({
      ensureReady: () => actionsRef.current.ensureReady(),
      placeOutboundCall: (request) => actionsRef.current.placeOutboundCall(request),
      hangUp: () => actionsRef.current.hangUp(),
      toggleMute: () => actionsRef.current.toggleMute(),
      refreshMicAccess: () => actionsRef.current.refreshMicAccess(),
    }),
    [],
  );

  const stateValue = useMemo<VoiceClientStateValue>(
    () => ({
      phase,
      errorMessage,
      micAccess,
      isMuted,
      elapsedLabel: formatVoiceElapsed(elapsedSeconds),
      isBusy: phase === 'connecting' || phase === 'in-call',
      activeContactLabel,
    }),
    [activeContactLabel, elapsedSeconds, errorMessage, isMuted, micAccess, phase],
  );

  const value = useMemo<VoiceClientContextValue>(
    () => ({
      ...stateValue,
      ...stableActions,
    }),
    [stableActions, stateValue],
  );

  return (
    <VoiceClientActionsContext.Provider value={stableActions}>
      <VoiceClientContext.Provider value={value}>{children}</VoiceClientContext.Provider>
    </VoiceClientActionsContext.Provider>
  );
}

export function useVoiceClient() {
  const context = useContext(VoiceClientContext);
  if (!context) {
    throw new Error('useVoiceClient must be used within VoiceClientProvider');
  }

  return context;
}

/** Stable voice actions that do not re-render when call timer/state ticks. */
export function useVoiceClientActions() {
  const context = useContext(VoiceClientActionsContext);
  if (!context) {
    throw new Error('useVoiceClientActions must be used within VoiceClientProvider');
  }

  return context;
}
