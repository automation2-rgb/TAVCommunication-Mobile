import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { Search, X } from '@/components/icons/lucide';
import { fetchWorkspaceSearch, SearchApiError } from '@/lib/search/search-api';
import {
  enrichSearchRowsWithInboxNames,
  flattenSearchResults,
  formatRecentThreadPreview,
  formatSearchMessagePreview,
  formatSearchResultTitle,
  getSearchThreadTitle,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_QUERY_LENGTH,
  shouldShowInboxNameForRow,
} from '@/lib/search/search-display';
import { pressScaleStyle, tavColors, tavShadows, tavTypography } from '@/lib/theme';
import type { SearchPressableRow, SearchRecentThread, SearchResultRow, SearchSelectPayload } from '@/types/search';

type SearchModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectResult: (payload: SearchSelectPayload) => void;
  recentThreads: SearchRecentThread[];
  recentInboxId: string | null;
  recentInboxName: string | null;
  inboxNameById: Record<string, string>;
  currentUserName?: string | null;
};

function SearchSkeletonRows() {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLines}>
            <View style={styles.skeletonLinePrimary} />
            <View style={styles.skeletonLineSecondary} />
          </View>
        </View>
      ))}
    </View>
  );
}

function SearchResultRowView({
  row,
  currentUserName,
  showInboxName,
  onPress,
}: {
  row: SearchPressableRow;
  currentUserName?: string | null;
  showInboxName: boolean;
  onPress: () => void;
}) {
  if (row.kind === 'recent') {
    const title = row.thread.display_name?.trim() || row.thread.customer_e164 || 'Conversation';
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}>
        <ContactAvatar displayName={row.thread.display_name} phoneE164={row.thread.customer_e164} size="md" />
        <View style={styles.resultContent}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.resultPreview} numberOfLines={2}>
            {formatRecentThreadPreview(row.thread)}
          </Text>
        </View>
      </Pressable>
    );
  }

  const threadTitle = getSearchThreadTitle(row.thread);
  const title = formatSearchResultTitle(threadTitle, row.inboxDisplayName, showInboxName);
  const preview =
    row.kind === 'message'
      ? formatSearchMessagePreview(row.message, currentUserName)
      : row.subtitle?.trim() || 'Thread match';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.resultRow, pressed && styles.resultRowPressed]}>
      <ContactAvatar displayName={row.thread.display_name} phoneE164={row.thread.customer_e164} size="md" />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.resultPreview} numberOfLines={2}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
}

export function SearchModal({
  visible,
  onClose,
  onSelectResult,
  recentThreads,
  recentInboxId,
  recentInboxName,
  inboxNameById,
  currentUserName,
}: SearchModalProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const searchGenerationRef = useRef(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmedQuery = query.trim();
  const showRecent = trimmedQuery.length < SEARCH_MIN_QUERY_LENGTH && !loading;
  const showSkeleton = loading && trimmedQuery.length >= SEARCH_MIN_QUERY_LENGTH;

  const listRows = useMemo(() => {
    if (showRecent) {
      if (!recentInboxId) {
        return [];
      }
      return recentThreads.slice(0, 5).map(
        (thread): SearchPressableRow => ({
          key: `recent-${thread.id}`,
          kind: 'recent',
          inboxId: recentInboxId,
          thread,
        }),
      );
    }

    return enrichSearchRowsWithInboxNames(flattenSearchResults(results), inboxNameById);
  }, [inboxNameById, recentInboxId, recentThreads, results, showRecent]);

  const performSearch = useCallback(async (searchQuery: string) => {
    const normalized = searchQuery.trim();
    const generation = ++searchGenerationRef.current;

    if (normalized.length < SEARCH_MIN_QUERY_LENGTH) {
      setResults([]);
      setErrorMessage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextResults = await fetchWorkspaceSearch(normalized);
      if (generation !== searchGenerationRef.current) {
        return;
      }
      setResults(nextResults);
    } catch (error) {
      if (generation !== searchGenerationRef.current) {
        return;
      }
      setResults([]);
      setErrorMessage(error instanceof SearchApiError ? error.message : 'Search failed. Please try again.');
    } finally {
      if (generation === searchGenerationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      searchGenerationRef.current += 1;
      setQuery('');
      setResults([]);
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      void performSearch(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [performSearch, query, visible]);

  const handleSelectRow = useCallback(
    (row: SearchPressableRow) => {
      if (row.kind === 'recent') {
        onSelectResult({ inboxId: row.inboxId, threadId: row.thread.id });
        onClose();
        return;
      }

      onSelectResult({
        inboxId: row.inboxId,
        threadId: row.threadId,
        messageId: row.kind === 'message' ? row.messageId : undefined,
      });
      onClose();
    },
    [onClose, onSelectResult],
  );

  const emptyHint = useMemo(() => {
    if (showRecent) {
      if (recentThreads.length > 0) {
        return recentInboxName
          ? `Recent in ${recentInboxName}. Type to search all inboxes.`
          : 'Type to search all inboxes.';
      }
      return `Type at least ${SEARCH_MIN_QUERY_LENGTH} characters to search all inboxes.`;
    }

    if (loading) {
      return null;
    }

    if (errorMessage) {
      return errorMessage;
    }

    if (trimmedQuery.length >= SEARCH_MIN_QUERY_LENGTH) {
      return 'No results found.';
    }

    return null;
  }, [errorMessage, loading, recentInboxName, recentThreads.length, showRecent, trimmedQuery.length]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { marginTop: insets.top + 12, marginBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Search color={tavColors.zinc500} size={18} strokeWidth={2.2} />
            <TextInput
              ref={inputRef}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              placeholder="Search all inboxes"
              placeholderTextColor={tavColors.zinc400}
              returnKeyType="search"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close search"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressScaleStyle(pressed)]}>
              <X color={tavColors.zinc600} size={20} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.body}>
            {showRecent && recentThreads.length > 0 ? (
              <Text style={styles.sectionLabel}>Recent in this inbox</Text>
            ) : null}

            {showSkeleton ? (
              <SearchSkeletonRows />
            ) : listRows.length > 0 ? (
              <FlatList
                data={listRows}
                keyboardShouldPersistTaps="handled"
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                  <SearchResultRowView
                    currentUserName={currentUserName}
                    row={item}
                    showInboxName={
                      item.kind !== 'recent' &&
                      shouldShowInboxNameForRow(item.inboxId, listRows, recentInboxId)
                    }
                    onPress={() => {
                      handleSelectRow(item);
                    }}
                  />
                )}
                style={styles.resultsList}
              />
            ) : (
              <View style={styles.emptyState}>
                {loading ? <ActivityIndicator color={tavColors.blue} /> : null}
                {emptyHint ? <Text style={styles.emptyText}>{emptyHint}</Text> : null}
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap a result to open the conversation.</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: tavColors.white,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '82%',
    ...tavShadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    backgroundColor: tavColors.zinc50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: tavColors.zinc900,
    paddingVertical: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    minHeight: 220,
    maxHeight: 420,
  },
  sectionLabel: {
    ...tavTypography.meta,
    color: tavColors.zinc500,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontWeight: '600',
  },
  resultsList: {
    flexGrow: 0,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc100,
  },
  resultRowPressed: {
    backgroundColor: tavColors.zinc50,
  },
  resultContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  resultTitle: {
    ...tavTypography.threadTitle,
    color: tavColors.zinc900,
  },
  resultPreview: {
    ...tavTypography.threadSnippet,
    color: tavColors.zinc600,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc500,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tavColors.zinc200,
    backgroundColor: tavColors.zinc50,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 12,
    color: tavColors.zinc500,
    textAlign: 'center',
  },
  skeletonWrap: {
    paddingVertical: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tavColors.zinc100,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLinePrimary: {
    height: 12,
    width: '55%',
    borderRadius: 6,
    backgroundColor: tavColors.zinc100,
  },
  skeletonLineSecondary: {
    height: 10,
    width: '80%',
    borderRadius: 5,
    backgroundColor: tavColors.zinc100,
  },
});
