import { useCallback, useMemo, useState } from 'react';

import {

  ActivityIndicator,

  Alert,

  FlatList,

  Modal,

  Pressable,

  StyleSheet,

  Text,

  TextInput,

  View,

} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';



import { VoiceInboxPickerSheet } from '@/components/calls/voice-inbox-picker-sheet';

import { ContactRow } from '@/components/contacts/contact-row';

import { ContactTabs } from '@/components/contacts/contact-tabs';

import { useContactsDirectory, useContactsSearch } from '@/hooks/use-contacts-directory';

import { useTeamContacts } from '@/hooks/use-team-contacts';

import { useInboxWorkspace } from '@/contexts/inbox-workspace';

import { useVoiceClientActions } from '@/contexts/voice-client';

import { isValidE164Phone } from '@/lib/phone/e164';

import { placeVoiceCallToNumber } from '@/lib/voice/place-voice-call';

import { getVoiceEnabledInboxes } from '@/lib/voice/voice-inboxes';

import { tavColors } from '@/lib/theme';

import type { ContactDirectoryKind, ContactDirectoryRow } from '@/types/messaging';



type NewCallModalProps = {

  visible: boolean;

  onClose: () => void;

};



type PendingContactCall = {

  contact: ContactDirectoryRow;

  phoneE164: string;

};



export function NewCallModal({ visible, onClose }: NewCallModalProps) {

  const insets = useSafeAreaInsets();

  const { inboxes } = useInboxWorkspace();

  const { ensureReady, placeOutboundCall } = useVoiceClientActions();

  const [activeTab, setActiveTab] = useState<ContactDirectoryKind>('external');

  const [query, setQuery] = useState('');

  const [isCalling, setIsCalling] = useState(false);

  const [inboxPickerOpen, setInboxPickerOpen] = useState(false);

  const [pendingCall, setPendingCall] = useState<PendingContactCall | null>(null);



  const voiceInboxes = useMemo(() => getVoiceEnabledInboxes(inboxes), [inboxes]);

  const trimmedQuery = query.trim();

  const isSearchingExternal = activeTab === 'external' && trimmedQuery.length >= 2;

  const isTeamTab = activeTab === 'team';



  const externalBrowse = useContactsDirectory({

    kind: 'external',

    enabled: visible && activeTab === 'external' && !isSearchingExternal,

  });

  const externalSearch = useContactsSearch(trimmedQuery, visible && isSearchingExternal);

  const team = useTeamContacts(trimmedQuery, visible && isTeamTab);



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



  const resetPending = () => {

    setPendingCall(null);

    setInboxPickerOpen(false);

  };



  const startCallWithInbox = useCallback(
    async (inboxId: string, contact: ContactDirectoryRow, phoneE164: string) => {
      setIsCalling(true);

      try {
        await placeVoiceCallToNumber({
          inboxId,
          phoneE164,
          contactLabel: contact.display_name?.trim() || phoneE164,
          ensureReady,
          placeOutboundCall,
        });

        resetPending();
        onClose();
      } catch (error) {
        Alert.alert(
          'Unable to place call',
          error instanceof Error ? error.message : 'Please try again.',
        );
      } finally {
        setIsCalling(false);
      }
    },
    [ensureReady, onClose, placeOutboundCall],
  );



  const beginCall = useCallback(
    (contact: ContactDirectoryRow) => {
      const phone = contact.phone_e164?.trim() ?? '';

      if (!isValidE164Phone(phone)) {
        Alert.alert('No phone number', 'This contact does not have a valid phone number to call.');
        return;
      }

      if (voiceInboxes.length === 0) {
        Alert.alert('Voice unavailable', 'No voice-enabled inbox is assigned to your account.');
        return;
      }

      if (voiceInboxes.length === 1) {
        void startCallWithInbox(voiceInboxes[0]!.id, contact, phone);
        return;
      }

      setPendingCall({ contact, phoneE164: phone });
      setInboxPickerOpen(true);
    },
    [startCallWithInbox, voiceInboxes],
  );

  const keyExtractor = useCallback((item: ContactDirectoryRow) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: ContactDirectoryRow }) => (
      <ContactRow
        contact={item}
        badge={isTeamTab && item.tags?.[0] ? item.tags[0] : null}
        onPress={beginCall}
      />
    ),
    [beginCall, isTeamTab],
  );

  return (

    <>

      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>

        <View style={[styles.container, { paddingTop: insets.top + 8 }]}>

          <View style={styles.header}>

            <Pressable onPress={onClose} disabled={isCalling}>

              <Text style={styles.cancel}>Cancel</Text>

            </Pressable>

            <Text style={styles.title}>New call</Text>

            <View style={styles.headerSpacer} />

          </View>



          <TextInput

            placeholder={isTeamTab ? 'Search teammates' : 'Search contacts'}

            placeholderTextColor={tavColors.zinc500}

            style={styles.searchInput}

            value={query}

            onChangeText={setQuery}

          />



          <ContactTabs

            activeTab={activeTab}

            onChange={(tab) => {

              setActiveTab(tab);

              setQuery('');

            }}

          />



          {isLoading ? (

            <View style={styles.loading}>

              <ActivityIndicator color={tavColors.blue} />

            </View>

          ) : (

            <FlatList
              data={contacts}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
            />

          )}



          {isCalling ? (

            <View style={styles.callingOverlay}>

              <ActivityIndicator color={tavColors.white} size="large" />

              <Text style={styles.callingText}>Connecting…</Text>

            </View>

          ) : null}

        </View>

      </Modal>



      <VoiceInboxPickerSheet

        visible={inboxPickerOpen}

        inboxes={voiceInboxes}

        onClose={resetPending}

        onSelect={(inboxId) => {

          if (!pendingCall) {

            return;

          }

          void startCallWithInbox(inboxId, pendingCall.contact, pendingCall.phoneE164);

        }}

      />

    </>

  );

}



const styles = StyleSheet.create({

  container: {

    flex: 1,

    backgroundColor: tavColors.zinc50,

  },

  header: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 16,

    paddingBottom: 12,

  },

  cancel: {

    fontSize: 16,

    color: tavColors.blue,

    fontWeight: '500',

    minWidth: 72,

  },

  title: {

    flex: 1,

    textAlign: 'center',

    fontSize: 17,

    fontWeight: '600',

    color: tavColors.zinc900,

  },

  headerSpacer: {

    minWidth: 72,

  },

  searchInput: {

    marginHorizontal: 16,

    marginBottom: 8,

    borderWidth: 1,

    borderColor: tavColors.zinc200,

    borderRadius: 12,

    paddingHorizontal: 14,

    paddingVertical: 12,

    backgroundColor: tavColors.white,

    fontSize: 16,

    color: tavColors.zinc900,

  },

  loading: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

  },

  callingOverlay: {

    ...StyleSheet.absoluteFill,

    backgroundColor: 'rgba(0,0,0,0.45)',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 12,

  },

  callingText: {

    color: tavColors.white,

    fontSize: 16,

    fontWeight: '600',

  },

});


