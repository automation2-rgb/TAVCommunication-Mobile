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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactAvatar } from '@/components/avatars/contact-avatar';
import { ContactRow } from '@/components/contacts/contact-row';
import { Composer, type ComposerSendPayload } from '@/components/inbox/composer';
import { InboxEmptyState } from '@/components/inbox/empty-state';
import { ArrowLeft, Search, Users, X } from '@/components/icons/lucide';
import { useContactsDirectory, useContactsSearch } from '@/hooks/use-contacts-directory';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { isValidE164Phone } from '@/lib/phone/e164';
import { sendDirectMessage } from '@/lib/messaging/send-message';
import { fetchThreadById, isDirectThread } from '@/lib/messaging/threads';
import { pressScaleStyle, tavColors, tavLayout, tavShadows, tavTypography } from '@/lib/theme';
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
  const insets = useSafeAreaInsets();
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
  const browse = useContactsDirectory({ kind: 'external', enabled: !isSearching && !recipient });
  const search = useContactsSearch(trimmedQuery, isSearching && !recipient);

  const contacts = useMemo(
    () => (isSearching ? search.results : browse.contacts),
    [browse.contacts, isSearching, search.results],
  );

  const isLoadingContacts = isSearching ? search.isSearching : browse.isLoading;
  const contactsError = isSearching ? search.error : browse.error;
  const showContactList = !recipient;

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
    setQuery('');
    setManualOpen(false);
    setManualE164('');
  }, []);

  const handleClearRecipient = useCallback(() => {
    setRecipient(null);
    setQuery('');
    setManualOpen(false);
    setManualE164('');
  }, []);

  const handleApplyManual = () => {
    const trimmed = manualE164.trim();
    if (!isValidE164Phone(trimmed)) {
      return;
    }
    setRecipient({ e164: trimmed, label: trimmed });
    setQuery('');
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
      <View style={styles.recipientCard}>
        <Text style={styles.cardTitle}>Who are you messaging?</Text>

        {historyOnly ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>This inbox is history-only. Sending is disabled.</Text>
          </View>
        ) : null}

        {recipient ? (
          <View style={styles.recipientChip}>
            <ContactAvatar displayName={recipient.label} phoneE164={recipient.e164} size="md" />
            <View style={styles.recipientChipText}>
              <Text numberOfLines={1} style={styles.recipientChipTitle}>
                {recipient.label}
              </Text>
              <Text numberOfLines={1} style={styles.recipientChipMeta}>
                {recipient.e164}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change recipient"
              onPress={handleClearRecipient}
              style={({ pressed }) => [styles.recipientClear, pressScaleStyle(pressed)]}>
              <X color={tavColors.zinc600} size={16} strokeWidth={2.4} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.searchField}>
              <Search color={tavColors.zinc400} size={18} strokeWidth={2.2} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Search contacts by name or number"
                placeholderTextColor={tavColors.zinc400}
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
              />
              {query.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={8}
                  onPress={() => setQuery('')}
                  style={({ pressed }) => [styles.searchClear, pressScaleStyle(pressed)]}>
                  <X color={tavColors.zinc500} size={16} strokeWidth={2.4} />
                </Pressable>
              ) : null}
            </View>

            {manualOpen ? (
              <View style={styles.manualBlock}>
                <Text style={styles.manualLabel}>Phone number</Text>
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
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setManualOpen(false)}
                    style={({ pressed }) => [styles.manualCancelButton, pressScaleStyle(pressed)]}>
                    <Text style={styles.manualCancel}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={!isValidE164Phone(manualE164.trim())}
                    onPress={handleApplyManual}
                    style={({ pressed }) => [
                      styles.manualApply,
                      !isValidE164Phone(manualE164.trim()) && styles.manualApplyDisabled,
                      pressScaleStyle(pressed),
                    ]}>
                    <Text style={styles.manualApplyLabel}>Use number</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.helperLinks}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setManualOpen(true)}
                  style={({ pressed }) => [styles.helperLink, pressScaleStyle(pressed)]}>
                  <Text style={styles.helperLinkLabel}>Enter number manually</Text>
                </Pressable>
                <Text style={styles.helperDivider}>·</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(app)/contacts/index' as Href)}
                  style={({ pressed }) => [styles.helperLink, pressScaleStyle(pressed)]}>
                  <Users color={tavColors.blue} size={15} strokeWidth={2.2} />
                  <Text style={styles.helperLinkLabel}>Open directory</Text>
                </Pressable>
              </View>
            )}
          </>
        )}

        {contactsError ? (
          <Text style={styles.errorText}>{contactsError.message || 'Unable to load contacts.'}</Text>
        ) : null}
      </View>

      {showContactList ? (
        <Text style={styles.contactsSectionLabel}>
          {isSearching ? 'Search results' : 'Contacts'}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressScaleStyle(pressed)]}>
          <ArrowLeft color={tavColors.zinc700} size={20} strokeWidth={2.2} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <View style={styles.headerTitleBlock}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            New message
          </Text>
          {activeInbox?.display_name ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {activeInbox.display_name}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.flex}>
        {showContactList && isLoadingContacts && contacts.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={tavColors.blue} />
          </View>
        ) : showContactList ? (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={listHeader}
            ListEmptyComponent={
              !isLoadingContacts ? (
                <View style={styles.emptyWrap}>
                  <InboxEmptyState
                    title={isSearching ? 'No matches' : 'No contacts yet'}
                    description={
                      isSearching
                        ? 'Try a different name or phone number.'
                        : 'Browse the directory or enter a number manually.'
                    }
                    variant="no-threads"
                  />
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.contactRowWrap,
                  index === 0 && styles.contactRowFirst,
                  index === contacts.length - 1 && styles.contactRowLast,
                ]}>
                <ContactRow contact={item} onPress={handleSelectContact} />
              </View>
            )}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.recipientOnlyBody}>
            {listHeader}
            <View style={styles.readyHint}>
              <Text style={styles.readyHintText}>Type your message below to start the conversation.</Text>
            </View>
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tavColors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
    minHeight: tavLayout.headerHeight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.zinc700,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  headerSubtitle: {
    fontSize: 12,
    color: tavColors.zinc500,
  },
  headerSpacer: {
    width: 72,
  },
  list: {
    flex: 1,
    backgroundColor: tavColors.zinc50,
  },
  listContent: {
    paddingBottom: 16,
  },
  listHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  recipientCard: {
    marginHorizontal: 16,
    backgroundColor: tavColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    padding: 16,
    gap: 12,
    ...tavShadows.sm,
  },
  cardTitle: {
    ...tavTypography.sectionTitle,
    fontSize: 16,
  },
  warningBanner: {
    backgroundColor: tavColors.amber50,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.amber800,
  },
  recipientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    backgroundColor: tavColors.zinc50,
  },
  recipientChipText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  recipientChipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  recipientChipMeta: {
    fontSize: 13,
    color: tavColors.zinc500,
  },
  recipientClear: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.white,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    backgroundColor: tavColors.zinc50,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: tavColors.zinc900,
    paddingVertical: 0,
  },
  searchClear: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualBlock: {
    gap: 8,
  },
  manualLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.zinc600,
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
    marginTop: 4,
  },
  manualCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  manualCancel: {
    fontSize: 15,
    color: tavColors.zinc600,
    fontWeight: '500',
  },
  manualApply: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: tavColors.blue,
  },
  manualApplyDisabled: {
    opacity: 0.45,
  },
  manualApplyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.white,
  },
  helperLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  helperLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  helperLinkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: tavColors.blue,
  },
  helperDivider: {
    fontSize: 14,
    color: tavColors.zinc300,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.red600,
  },
  contactsSectionLabel: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    color: tavColors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  contactRowWrap: {
    marginHorizontal: 16,
    backgroundColor: tavColors.white,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: tavColors.zinc200,
    overflow: 'hidden',
  },
  contactRowFirst: {
    borderTopWidth: 1,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  contactRowLast: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 8,
    ...tavShadows.sm,
  },
  recipientOnlyBody: {
    flex: 1,
    backgroundColor: tavColors.zinc50,
  },
  readyHint: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: tavColors.white,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  readyHintText: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc600,
    textAlign: 'center',
  },
  emptyWrap: {
    marginHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: tavColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tavColors.zinc50,
  },
});
