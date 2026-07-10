import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useComposerAttachments } from '@/hooks/use-composer-attachments';
import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import { isImageMimeType } from '@/lib/messaging/mms-policy';
import { isValidE164Phone } from '@/lib/phone/e164';
import { sendDirectMessage } from '@/lib/messaging/send-message';
import { fetchThreadById, isDirectThread } from '@/lib/messaging/threads';
import { tavColors } from '@/lib/theme';

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
  const [query, setQuery] = useState('');
  const [manualE164, setManualE164] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { results, isSearching } = useContactsSearch(query, query.trim().length >= 2);
  const { files, removeFile, pickFromLibrary, pickFromCamera } = useComposerAttachments();

  useEffect(() => {
    const to = firstParam(params.to)?.trim();
    if (to && isValidE164Phone(to)) {
      setManualE164(to);
    }
  }, [params.to]);

  const recipient = useMemo(() => {
    const manual = manualE164.trim();
    if (isValidE164Phone(manual)) {
      return manual;
    }
    return null;
  }, [manualE164]);

  const canSend = Boolean(
    activeInbox?.twilio_phone_e164 && recipient && (body.trim().length > 0 || files.length > 0),
  );

  const handleSend = async () => {
    if (!activeInbox?.id || !recipient || (!body.trim() && files.length === 0)) {
      return;
    }

    setIsSending(true);
    try {
      const result = await sendDirectMessage({
        inboxId: activeInbox.id,
        toE164: recipient,
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

      Alert.alert('Message sent', `Your message was sent to ${recipient}.`);
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

        <View style={styles.attachmentRow}>
          <Pressable disabled={isSending} onPress={() => void pickFromLibrary()} style={styles.attachButton}>
            <Text style={styles.attachLabel}>Photo library</Text>
          </Pressable>
          <Pressable
            disabled={isSending}
            onPress={() => void pickFromCamera()}
            style={styles.attachButtonSecondary}>
            <Text style={styles.attachLabelSecondary}>Camera</Text>
          </Pressable>
        </View>

        {files.length > 0 ? (
          <ScrollView horizontal contentContainerStyle={styles.previewRow} showsHorizontalScrollIndicator={false}>
            {files.map((file, index) => (
              <View key={`${file.uri}-${index}`} style={styles.previewTile}>
                {isImageMimeType(file.type) ? (
                  <Image source={{ uri: file.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewFile}>
                    <Text style={styles.previewFileIcon}>📎</Text>
                    <Text numberOfLines={2} style={styles.previewFileLabel}>
                      {file.name}
                    </Text>
                  </View>
                )}
                <Pressable
                  disabled={isSending}
                  onPress={() => removeFile(index)}
                  style={styles.removeButton}>
                  <Text style={styles.removeLabel}>×</Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

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
  attachmentRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  attachButton: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: tavColors.zinc50,
  },
  attachButtonSecondary: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: tavColors.white,
  },
  attachLabel: {
    color: tavColors.zinc700,
    fontSize: 14,
    fontWeight: '500',
  },
  attachLabelSecondary: {
    color: tavColors.zinc700,
    fontSize: 14,
    fontWeight: '500',
  },
  previewRow: {
    gap: 8,
  },
  previewTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: tavColors.zinc100,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  previewFileIcon: {
    fontSize: 18,
  },
  previewFileLabel: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    color: tavColors.zinc600,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(9, 9, 11, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    color: tavColors.white,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
});
