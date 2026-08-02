import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CallLogRow } from '@/components/calls/call-log-row';
import { InboxEmptyState } from '@/components/inbox/empty-state';
import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import { useMissedCalls } from '@/contexts/missed-calls';
import { fetchCallLogs } from '@/lib/voice/call-logs';
import { markCallsSeenNow } from '@/lib/voice/calls-last-seen';
import { tavColors } from '@/lib/theme';
import type { CallLog } from '@/types/voice';

export default function CallsScreen() {
  const { refreshMissedCount } = useMissedCalls();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <SupportScreenShell title="Calls" padded={false}>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={tavColors.blue} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
          ListEmptyComponent={
            <InboxEmptyState title="No calls logged yet." description="Outbound and inbound calls appear here." />
          }
          renderItem={({ item }) => <CallLogRow call={item} />}
        />
      )}
    </SupportScreenShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  error: {
    fontSize: 15,
    color: tavColors.red600,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
});
