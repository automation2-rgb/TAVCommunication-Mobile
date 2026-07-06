import { Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { useContactsSearch } from '@/hooks/use-contacts-directory';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { sendDirectMessage } from '@/lib/messaging/send-message';
import { tavColors } from '@/lib/theme';

export default function ComposeScreen() {
  const router = useRouter();
  const { activeInbox } = useInboxWorkspace();
  const [query, setQuery] = useState('');
  const [manualE164, setManualE164] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { results, isSearching } = useContactsSearch(query, query.trim().length >= 2);

  const recipient = useMemo(() => {
    const manual = manualE164.trim();
    if (/^\+\d{10,15}$/.test(manual)) {
      return manual;
    }
    return null;
  }, [manualE164]);

  const canSend = Boolean(activeInbox?.twilio_phone_e164 && body.trim() && recipient);

  const handleSend = async () => {
    if (!activeInbox?.id || !recipient || !body.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const result = await sendDirectMessage({
        inboxId: activeInbox.id,
        toE164: recipient,
        body: body.trim(),
      });

      if (result.threadId) {
        router.replace(`/(app)/inbox/${result.threadId}` as Href);
        return;
      }

      Alert.alert('Message sent', 'Your message was sent. Open the thread from the inbox list.');
      router.back();
    } catch (error) {
      Alert.alert('Send failed', error instanceof Error ? error.message : 'Unable to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New conversation</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!activeInbox?.twilio_phone_e164 ? (
          <Text style={styles.warning}>This inbox is history-only. Sending is disabled.</Text>
        ) : null}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Search contacts</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Name or phone"
            placeholderTextColor={tavColors.zinc500}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {isSearching ? <ActivityIndicator color={tavColors.blue} /> : null}

        {results.slice(0, 8).map((contact) => (
          <Pressable
            key={contact.id}
            style={styles.resultRow}
            onPress={() => {
              setManualE164(contact.phone_e164);
              setQuery(contact.display_name ?? contact.phone_e164);
            }}>
            <Text style={styles.resultTitle}>{contact.display_name ?? contact.phone_e164}</Text>
            <Text style={styles.resultMeta}>{contact.phone_e164}</Text>
          </Pressable>
        ))}

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Recipient (E.164)</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            placeholder="+15551234567"
            placeholderTextColor={tavColors.zinc500}
            style={styles.input}
            value={manualE164}
            onChangeText={setManualE164}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            multiline
            maxLength={1600}
            placeholder="Write your first message"
            placeholderTextColor={tavColors.zinc500}
            style={[styles.input, styles.messageInput]}
            value={body}
            onChangeText={setBody}
          />
        </View>

        <AuthButton
          disabled={!canSend || isSending}
          label={isSending ? 'Sending…' : 'Send'}
          onPress={() => {
            void handleSend();
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tavColors.white,
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
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  warning: {
    color: tavColors.amber600,
    fontSize: 14,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  input: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: tavColors.zinc900,
    backgroundColor: tavColors.white,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  resultRow: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  resultMeta: {
    fontSize: 13,
    color: tavColors.zinc500,
  },
});
