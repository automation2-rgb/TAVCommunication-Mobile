import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { ContactRow } from '@/components/contacts/contact-row';
import { Composer, type ComposerSendPayload } from '@/components/inbox/composer';
import { Search, X } from '@/components/icons/lucide';
import { useContactsDirectory, useContactsSearch } from '@/hooks/use-contacts-directory';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { isValidE164Phone } from '@/lib/phone/e164';
import { sendDirectMessage } from '@/lib/messaging/send-message';
import { fetchThreadById, isDirectThread } from '@/lib/messaging/threads';
import { pressScaleStyle, tavColors, tavLayout } from '@/lib/theme';
import type { ContactDirectoryRow } from '@/types/messaging';

type ComposeRecipient = {
  e164: string;
  label: string;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default function ComposeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ to?: string | string[] }>();
  const { activeInbox } = useInboxWorkspace();
  const [recipient, setRecipient] = useState<ComposeRecipient | null>(null);
  const [query, setQuery] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualE164, setManualE164] = useState('');
  const [isSending, setIsSending] = useState(false);

  const historyOnly = !activeInbox?.twilio_phone_e164;
  const canSend = Boolean(activeInbox?.twilio_phone_e164 && recipient);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= 2;
  const browse = useContactsDirectory({ kind: 'external', enabled: !isSearching });
  const search = useContactsSearch(trimmedQuery, isSearching);

  const contacts = useMemo(
    () => (isSearching ? search.results : browse.contacts),
    [browse.contacts, isSearching, search.results],
  );

  const isLoadingContacts = isSearching ? search.isSearching : browse.isLoading;
  const contactsError = isSearching ? search.error : browse.error;

  useEffect(() => {
    const to = firstParam(params.to)?.trim();
    if (to && isValidE164Phone(to)) {
      setRecipient({ e164: to, label: to });
    }
  }, [params.to]);

  const handleSelectContact = useCallback((contact: ContactDirectoryRow) => {
    const phone = contact.phone_e164?.trim() ?? '';
    if (!isValidE164Phone(phone)) {
      Alert.alert('No phone number', 'This contact does not have a valid phone number.');
      return;
    }
    setRecipient({
      e164: phone,
      label: contact.display_name?.trim() || phone,
    });
    setManualOpen(false);
    setManualE164('');
  }, []);

  const handleApplyManual = () => {
    const trimmed = manualE164.trim();
    if (!isValidE164Phone(trimmed)) {
      return;
    }
    setRecipient({ e164: trimmed, label: trimmed });
    setManualOpen(false);
  };

  const handleSend = async ({ body, files }: ComposerSendPayload) => {
    if (!activeInbox?.id || !recipient || (!body.trim() && files.length === 0)) {
      return;
    }

    setIsSending(true);
    try {
      const result = await sendDirectMessage({
        inboxId: activeInbox.id,
        toE164: recipient.e164,
        body: body.trim(),
        files,
      });

      if (result.threadId) {
        const returnedThread = await fetchThreadById(result.threadId);
        if (returnedThread && isDirectThread(returnedThread)) {
          router.replace(`/(app)/inbox/${result.threadId}` as Href);
          return;
        }
      }

      Alert.alert('Message sent', `Your message was sent to ${recipient.label}.`);
      router.back();
    } catch (error) {
      Alert.alert('Send failed', error instanceof Error ? error.message : 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const listHeader = (
    <View style={styles.listHeader}>
      {historyOnly ? (
        <Text style={styles.warning}>This inbox is history-only. Sending is disabled.</Text>
      ) : null}

      {recipient ? (
        <View style={styles.toRow}>
          <Text style={styles.toLabel}>To</Text>
          <View style={styles.toChip}>
            <ContactAvatar displayName={recipient.label} phoneE164={recipient.e164} size="sm" />
            <View style={styles.toChipText}>
              <Text numberOfLines={1} style={styles.toChipTitle}>
                {recipient.label}
              </Text>
              <Text numberOfLines={1} style={styles.toChipMeta}>
                {recipient.e164}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear recipient"
              onPress={() => setRecipient(null)}
              style={({ pressed }) => [styles.toClear, pressScaleStyle(pressed)]}>
              <X color={tavColors.zinc500} size={18} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.searchField}>
        <Search color={tavColors.zinc400} size={18} strokeWidth={2.2} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Search contacts"
          placeholderTextColor={tavColors.zinc400}
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {manualOpen ? (
        <View style={styles.manualBlock}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            placeholder="+15551234567"
            placeholderTextColor={tavColors.zinc400}
            style={styles.manualInput}
            value={manualE164}
            onChangeText={setManualE164}
          />
          <View style={styles.manualActions}>
            <Pressable onPress={() => setManualOpen(false)}>
              <Text style={styles.manualCancel}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={!isValidE164Phone(manualE164.trim())}
              onPress={handleApplyManual}
              style={({ pressed }) => [styles.manualApply, pressScaleStyle(pressed)]}>
              <Text style={styles.manualApplyLabel}>Use number</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setManualOpen(true)}
          style={({ pressed }) => [styles.manualLink, pressScaleStyle(pressed)]}>
          <Text style={styles.manualLinkLabel}>Enter number manually</Text>
        </Pressable>
      )}

      {contactsError ? (
        <Text style={styles.errorText}>
          {contactsError.message || 'Unable to load contacts.'}
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New message</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.flex}>
        {isLoadingContacts && contacts.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={tavColors.blue} />
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              !isLoadingContacts ? (
                <Text style={styles.emptyText}>
                  {isSearching ? 'No contacts match your search.' : 'No contacts yet.'}
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <ContactRow contact={item} onPress={handleSelectContact} />
            )}
            style={styles.list}
          />
        )}

        <Composer
          disabled={!canSend}
          disabledReason={
            historyOnly
              ? 'This inbox cannot send new messages.'
              : !recipient
                ? 'Select a contact to send.'
                : undefined
          }
          isSending={isSending}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tavColors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  cancel: {
    color: tavColors.blue,
    fontSize: 16,
    fontWeight: '500',
    minWidth: 72,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  headerSpacer: {
    minWidth: 72,
  },
  list: {
    flex: 1,
    backgroundColor: tavColors.threadListBg,
  },
  listHeader: {
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    paddingBottom: 8,
  },
  warning: {
    fontSize: 14,
    color: tavColors.amber800,
    backgroundColor: tavColors.amber50,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  toLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  toChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  toChipText: {
    flex: 1,
    minWidth: 0,
  },
  toChipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  toChipMeta: {
    fontSize: 14,
    color: tavColors.zinc500,
  },
  toClear: {
    width: tavLayout.iconButtonSize - 8,
    height: tavLayout.iconButtonSize - 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: tavColors.zinc100,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: tavColors.zinc900,
    paddingVertical: 0,
  },
  manualLink: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  manualLinkLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: tavColors.blue,
  },
  manualBlock: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  manualInput: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: tavColors.zinc900,
    backgroundColor: tavColors.white,
  },
  manualActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manualCancel: {
    fontSize: 15,
    color: tavColors.zinc600,
    fontWeight: '500',
  },
  manualApply: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: tavColors.blue,
  },
  manualApplyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.white,
  },
  errorText: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 14,
    color: tavColors.red600,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    fontSize: 15,
    color: tavColors.zinc500,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.threadListBg,
  },
});
