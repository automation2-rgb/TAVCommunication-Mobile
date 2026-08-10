import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CallDetailSheet } from '@/components/calls/call-detail-sheet';
import { CallLogRow } from '@/components/calls/call-log-row';
import { CallsQuickActions } from '@/components/calls/calls-quick-actions';
import { DialKeypadModal } from '@/components/calls/dial-keypad-modal';
import { NewCallModal } from '@/components/calls/new-call-modal';
import { VoiceInboxPickerSheet } from '@/components/calls/voice-inbox-picker-sheet';
import { Plus } from '@/components/icons/lucide';
import { InboxEmptyState } from '@/components/inbox/empty-state';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useMissedCallsActions } from '@/contexts/missed-calls';
import { useVoiceClientActions } from '@/contexts/voice-client';
import { getCallContactLabel } from '@/lib/voice/call-contact-label';
import { fetchCallLogs } from '@/lib/voice/call-logs';
import { markCallsSeenNow } from '@/lib/voice/calls-last-seen';
import { placeVoiceCallToNumber } from '@/lib/voice/place-voice-call';
import { getVoiceEnabledInboxes } from '@/lib/voice/voice-inboxes';
import { pressScaleStyle, tavColors } from '@/lib/theme';
import type { CallLog } from '@/types/voice';

type PendingCallRequest = {
  inboxId?: string;
  phoneE164: string;
  contactLabel: string;
};

const EMPTY_LIST = (
  <InboxEmptyState
    title="No calls yet"
    description="Place a call from a conversation, use the keypad, or tap + to call a contact."
  />
);

export default function CallsScreen() {
  const insets = useSafeAreaInsets();
  const { inboxes } = useInboxWorkspace();
  const { ensureReady, placeOutboundCall } = useVoiceClientActions();
  const { refreshMissedCount } = useMissedCallsActions();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newCallOpen, setNewCallOpen] = useState(false);
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [detailCall, setDetailCall] = useState<CallLog | null>(null);
  const [inboxPickerOpen, setInboxPickerOpen] = useState(false);
  const [pendingCall, setPendingCall] = useState<PendingCallRequest | null>(null);
  const [isCallingBack, setIsCallingBack] = useState(false);

  const voiceInboxes = useMemo(() => getVoiceEnabledInboxes(inboxes), [inboxes]);

  const loadCalls = useCallback(async () => {
    setError(null);
    const rows = await fetchCallLogs();
    setCalls(rows);
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        await loadCalls();
        await markCallsSeenNow();
        await refreshMissedCount();
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load calls.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [loadCalls, refreshMissedCount]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCalls();
      await markCallsSeenNow();
      await refreshMissedCount();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load calls.');
    } finally {
      setRefreshing(false);
    }
  }, [loadCalls, refreshMissedCount]);

  const startCall = useCallback(
    async (request: PendingCallRequest & { inboxId: string }) => {
      setIsCallingBack(true);
      try {
        await placeVoiceCallToNumber({
          inboxId: request.inboxId,
          phoneE164: request.phoneE164,
          contactLabel: request.contactLabel,
          ensureReady,
          placeOutboundCall,
        });
      } catch (callError) {
        Alert.alert(
          'Unable to place call',
          callError instanceof Error ? callError.message : 'Please try again.',
        );
      } finally {
        setIsCallingBack(false);
        setPendingCall(null);
      }
    },
    [ensureReady, placeOutboundCall],
  );

  const initiateCall = useCallback(
    (phoneE164: string, contactLabel: string, preferredInboxId?: string) => {
      if (voiceInboxes.length === 0) {
        Alert.alert('Voice unavailable', 'No voice-enabled inbox is assigned to your account.');
        return;
      }

      const preferredInbox = preferredInboxId
        ? voiceInboxes.find((inbox) => inbox.id === preferredInboxId)
        : null;

      if (preferredInbox) {
        void startCall({ inboxId: preferredInbox.id, phoneE164, contactLabel });
        return;
      }

      if (voiceInboxes.length === 1) {
        void startCall({ inboxId: voiceInboxes[0]!.id, phoneE164, contactLabel });
        return;
      }

      setPendingCall({ phoneE164, contactLabel });
      setInboxPickerOpen(true);
    },
    [startCall, voiceInboxes],
  );

  const handleCallBack = useCallback(
    (call: CallLog) => {
      if (isCallingBack) {
        return;
      }

      initiateCall(call.customer_e164, getCallContactLabel(call), call.inbox_id);
    },
    [initiateCall, isCallingBack],
  );

  const handlePressInfo = useCallback((call: CallLog) => {
    setDetailCall(call);
  }, []);

  const keyExtractor = useCallback((item: CallLog) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: CallLog }) => (
      <CallLogRow call={item} onPressInfo={handlePressInfo} onPressCall={handleCallBack} />
    ),
    [handleCallBack, handlePressInfo],
  );

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />,
    [handleRefresh, refreshing],
  );

  const listEmptyStyle = calls.length === 0 ? styles.emptyList : undefined;

  const screenHeader = useMemo(
    () => (
      <>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.headerTitle}>Calls</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="New call"
            onPress={() => setNewCallOpen(true)}
            style={({ pressed }) => [styles.newCallButton, pressScaleStyle(pressed)]}>
            <Plus color={tavColors.blue} size={22} strokeWidth={2.4} />
          </Pressable>
        </View>

        <CallsQuickActions onNewCall={() => setNewCallOpen(true)} onOpenKeypad={() => setKeypadOpen(true)} />

        <Text style={styles.sectionLabel}>Recent</Text>
      </>
    ),
    [insets.top],
  );

  return (
    <View style={styles.screen}>
      {screenHeader}

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={tavColors.blue} />
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={listEmptyStyle}
          refreshControl={refreshControl}
          ListEmptyComponent={EMPTY_LIST}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <NewCallModal visible={newCallOpen} onClose={() => setNewCallOpen(false)} />
      <DialKeypadModal visible={keypadOpen} onClose={() => setKeypadOpen(false)} />
      <CallDetailSheet
        call={detailCall}
        visible={detailCall !== null}
        onClose={() => setDetailCall(null)}
      />

      <VoiceInboxPickerSheet
        visible={inboxPickerOpen}
        inboxes={voiceInboxes}
        onClose={() => {
          setInboxPickerOpen(false);
          setPendingCall(null);
        }}
        onSelect={(inboxId) => {
          if (!pendingCall) {
            return;
          }

          void startCall({ ...pendingCall, inboxId });
          setInboxPickerOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tavColors.threadListBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: tavColors.white,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: tavColors.zinc900,
  },
  newCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc100,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: tavColors.zinc500,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: tavColors.threadListBg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyList: {
    flexGrow: 1,
  },
  errorBanner: {
    backgroundColor: tavColors.red50,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: tavColors.red600,
    fontSize: 14,
  },
});
