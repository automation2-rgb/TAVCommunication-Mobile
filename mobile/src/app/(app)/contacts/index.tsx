import { Href, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ContactRow } from '@/components/contacts/contact-row';
import { ContactTabs } from '@/components/contacts/contact-tabs';
import { InboxEmptyState } from '@/components/inbox/empty-state';
import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { useVoiceClientActions } from '@/contexts/voice-client';
import { useContactsDirectory, useContactsSearch } from '@/hooks/use-contacts-directory';
import { useTeamContacts } from '@/hooks/use-team-contacts';
import { findOrCreateDmConversation } from '@/lib/chat/messages';
import { isValidE164Phone } from '@/lib/phone/e164';
import { pickVoiceEnabledInbox, resolveDirectThreadForPhone } from '@/lib/voice/resolve-call-target';
import { tavColors } from '@/lib/theme';
import type { ContactDirectoryKind, ContactDirectoryRow } from '@/types/messaging';

export default function ContactsScreen() {
  const router = useRouter();
  const { inboxes } = useInboxWorkspace();
  const { ensureReady, placeOutboundCall } = useVoiceClientActions();
  const [activeTab, setActiveTab] = useState<ContactDirectoryKind>('external');
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const trimmedQuery = query.trim();
  const isSearchingExternal = activeTab === 'external' && trimmedQuery.length >= 2;
  const isTeamTab = activeTab === 'team';

  const externalBrowse = useContactsDirectory({
    kind: 'external',
    enabled: activeTab === 'external' && !isSearchingExternal,
  });
  const externalSearch = useContactsSearch(trimmedQuery, isSearchingExternal);
  const team = useTeamContacts(trimmedQuery, isTeamTab);

  const contacts = useMemo(() => {
    if (isTeamTab) {
      return team.contacts;
    }
    if (isSearchingExternal) {
      return externalSearch.results;
    }
    return externalBrowse.contacts;
  }, [
    externalBrowse.contacts,
    externalSearch.results,
    isSearchingExternal,
    isTeamTab,
    team.contacts,
  ]);

  const isLoading = isTeamTab
    ? team.isLoading
    : isSearchingExternal
      ? externalSearch.isSearching
      : externalBrowse.isLoading;

  const error = isTeamTab
    ? team.error
    : isSearchingExternal
      ? externalSearch.error
      : externalBrowse.error;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isTeamTab) {
        await team.refresh();
      } else if (!isSearchingExternal) {
        await externalBrowse.refresh();
      }
    } finally {
      setRefreshing(false);
    }
  }, [externalBrowse, isSearchingExternal, isTeamTab, team]);

  const openCompose = useCallback(
    (contact: ContactDirectoryRow) => {
      const phone = contact.phone_e164?.trim() ?? '';
      if (!isValidE164Phone(phone)) {
        Alert.alert('No phone number', 'This contact does not have a valid E.164 phone number.');
        return;
      }
      router.push(`/(app)/inbox/compose?to=${encodeURIComponent(phone)}` as Href);
    },
    [router],
  );

  const openChat = useCallback(
    async (contact: ContactDirectoryRow) => {
      try {
        const conversation = await findOrCreateDmConversation(contact.id);
        router.push(`/(app)/chat/${conversation.id}` as Href);
      } catch (error) {
        Alert.alert(
          'Unable to open chat',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
    [router],
  );

  const startCall = useCallback(
    async (contact: ContactDirectoryRow) => {
      const phone = contact.phone_e164?.trim() ?? '';
      if (!isValidE164Phone(phone)) {
        Alert.alert('No phone number', 'This contact does not have a valid phone number to call.');
        return;
      }

      const inbox = pickVoiceEnabledInbox(inboxes);
      if (!inbox) {
        Alert.alert('Voice unavailable', 'No voice-enabled inbox is assigned to your account.');
        return;
      }

      try {
        const threadId = await resolveDirectThreadForPhone(inbox.id, phone);
        await ensureReady();
        await placeOutboundCall({
          threadId,
          inboxId: inbox.id,
          customerE164: phone,
          contactLabel: contact.display_name?.trim() || phone,
        });
      } catch (error) {
        Alert.alert(
          'Unable to place call',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    },
    [ensureReady, inboxes, placeOutboundCall],
  );

  const openContactActions = useCallback(
    (contact: ContactDirectoryRow) => {
      const phone = contact.phone_e164?.trim() ?? '';
      const hasPhone = isValidE164Phone(phone);
      const isTeam = contact.source === 'team';
      const title = contact.display_name?.trim() || phone || 'Contact';

      const actions: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }> = [];

      if (isTeam) {
        actions.push({
          text: 'Message in app',
          onPress: () => {
            void openChat(contact);
          },
        });
      }

      if (hasPhone) {
        actions.push({
          text: 'Text (customer SMS)',
          onPress: () => openCompose(contact),
        });
        actions.push({
          text: 'Call',
          onPress: () => {
            void startCall(contact);
          },
        });
      }

      actions.push({ text: 'Cancel', style: 'cancel' });

      Alert.alert(title, undefined, actions);
    },
    [openChat, openCompose, startCall],
  );

  const emptyCopy = useMemo(() => {
    if (trimmedQuery.length > 0) {
      return {
        title: 'No results',
        description: `No ${isTeamTab ? 'teammates' : 'contacts'} match “${trimmedQuery}”.`,
      };
    }
    if (isTeamTab) {
      return {
        title: 'No teammates yet',
        description: 'Approved teammates with profiles will appear here.',
      };
    }
    return {
      title: 'No external contacts yet',
      description: 'Contacts added in the web app will show up here for compose.',
    };
  }, [isTeamTab, trimmedQuery]);

  return (
    <SupportScreenShell title="Contacts" padded={false}>
      <View style={styles.searchWrap}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          placeholder={isTeamTab ? 'Search teammates' : 'Search name or phone'}
          placeholderTextColor={tavColors.zinc500}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ContactTabs
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setQuery('');
        }}
      />

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error.message}</Text>
          <Pressable onPress={() => void handleRefresh()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {isLoading && contacts.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator color={tavColors.blue} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={contacts.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <InboxEmptyState title={emptyCopy.title} description={emptyCopy.description} />
          }
          ListFooterComponent={
            activeTab === 'external' && !isSearchingExternal && externalBrowse.isLoadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={tavColors.blue} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void handleRefresh();
              }}
              tintColor={tavColors.blue}
            />
          }
          onEndReached={() => {
            if (activeTab === 'external' && !isSearchingExternal) {
              void externalBrowse.loadMore();
            }
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              badge={isTeamTab && item.tags?.[0] ? item.tags[0] : null}
              onPress={openContactActions}
            />
          )}
        />
      )}
    </SupportScreenShell>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: tavColors.white,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: tavColors.zinc900,
    backgroundColor: tavColors.zinc50,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyList: {
    flexGrow: 1,
  },
  footerLoading: {
    paddingVertical: 16,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: tavColors.red50,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: tavColors.red600,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.blue,
  },
});
