import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserAvatar } from '@/components/avatars/user-avatar';
import { AuthButton } from '@/components/auth/auth-button';
import { Check, Search, X } from '@/components/icons/lucide';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useTeamContacts } from '@/hooks/use-team-contacts';
import { apiCreateGroupConversation, apiCreateDmConversation, ChatApiError } from '@/lib/chat/chat-api';
import { useAuth } from '@/lib/auth/auth-provider';
import { pressScaleStyle, tavColors, tavShadows } from '@/lib/theme';
import type { ContactDirectoryRow } from '@/types/messaging';

type NewChatModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
  initialPeerUserId?: string | null;
};

type Mode = 'dm' | 'group';

const MODE_OPTIONS: Array<{ value: Mode; label: string }> = [
  { value: 'dm', label: 'Direct' },
  { value: 'group', label: 'Group' },
];

export function NewChatModal({ visible, onClose, onCreated, initialPeerUserId }: NewChatModalProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const currentUserId = session?.user.id;
  const [mode, setMode] = useState<Mode>('dm');
  const [query, setQuery] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(initialPeerUserId ?? null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { contacts, isLoading } = useTeamContacts(query, visible);

  const teammates = useMemo(
    () => contacts.filter((contact) => contact.id !== currentUserId),
    [contacts, currentUserId],
  );

  const selectedMembers = useMemo(
    () => teammates.filter((contact) => selectedMemberIds.includes(contact.id)),
    [selectedMemberIds, teammates],
  );

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId],
    );
  };

  const removeMember = (userId: string) => {
    setSelectedMemberIds((current) => current.filter((id) => id !== userId));
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      if (mode === 'dm') {
        if (!selectedPeerId) {
          Alert.alert('Select a teammate', 'Choose someone to message.');
          return;
        }
        const conversation = await apiCreateDmConversation(selectedPeerId);
        onCreated(conversation.id);
        onClose();
        return;
      }

      if (selectedMemberIds.length < 2) {
        Alert.alert('Add members', 'Select at least two teammates for a group chat.');
        return;
      }

      const conversation = await apiCreateGroupConversation({
        memberUserIds: selectedMemberIds,
        title: groupTitle,
      });
      onCreated(conversation.id);
      onClose();
    } catch (error) {
      Alert.alert(
        'Unable to start chat',
        error instanceof ChatApiError ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTeammate = ({ item }: { item: ContactDirectoryRow }) => {
    const selected =
      mode === 'dm' ? selectedPeerId === item.id : selectedMemberIds.includes(item.id);

    return (
      <Pressable
        onPress={() => {
          if (mode === 'dm') {
            setSelectedPeerId(item.id);
          } else {
            toggleMember(item.id);
          }
        }}
        style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressScaleStyle(pressed)]}>
        <UserAvatar
          avatarStoragePath={item.avatar_storage_path}
          displayName={item.display_name}
          email={item.display_name ? null : item.phone_e164}
          size={40}
          variant="contact"
        />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.display_name ?? item.phone_e164}</Text>
          {item.tags?.[0] ? <Text style={styles.rowMeta}>{item.tags[0]}</Text> : null}
        </View>
        {selected ? (
          <View style={styles.checkBadge}>
            <Check color={tavColors.white} size={14} strokeWidth={3} />
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>New chat</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.panel}>
          <SegmentedControl
            options={MODE_OPTIONS}
            value={mode}
            onChange={(next) => {
              setMode(next);
              setSelectedPeerId(null);
              setSelectedMemberIds([]);
            }}
          />

          {mode === 'group' ? (
            <TextInput
              placeholder="Group name (optional)"
              placeholderTextColor={tavColors.zinc400}
              style={styles.titleInput}
              value={groupTitle}
              onChangeText={setGroupTitle}
            />
          ) : null}

          <View style={styles.searchField}>
            <Search color={tavColors.zinc400} size={18} strokeWidth={2.2} />
            <TextInput
              placeholder="Search teammates"
              placeholderTextColor={tavColors.zinc400}
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {mode === 'group' && selectedMembers.length > 0 ? (
            <ScrollView
              horizontal
              contentContainerStyle={styles.memberChipRow}
              showsHorizontalScrollIndicator={false}>
              {selectedMembers.map((member) => (
                <View key={member.id} style={styles.memberChip}>
                  <UserAvatar
                    avatarStoragePath={member.avatar_storage_path}
                    displayName={member.display_name}
                    email={member.display_name ? null : member.phone_e164}
                    size={28}
                    variant="contact"
                  />
                  <Text numberOfLines={1} style={styles.memberChipLabel}>
                    {member.display_name ?? member.phone_e164}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${member.display_name ?? 'member'}`}
                    onPress={() => removeMember(member.id)}
                    hitSlop={8}>
                    <X color={tavColors.zinc500} size={16} strokeWidth={2.2} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={tavColors.blue} />
          </View>
        ) : (
          <FlatList
            data={teammates}
            keyExtractor={(item) => item.id}
            renderItem={renderTeammate}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AuthButton
            disabled={isSubmitting}
            label={isSubmitting ? 'Creating…' : mode === 'dm' ? 'Start chat' : 'Create group'}
            onPress={() => {
              void handleCreate();
            }}
          />
        </View>
      </View>
    </Modal>
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
  panel: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    gap: 12,
    borderRadius: 16,
    backgroundColor: tavColors.white,
    ...tavShadows.sm,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: tavColors.zinc50,
    fontSize: 16,
    color: tavColors.zinc900,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: tavColors.zinc50,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: tavColors.zinc900,
    paddingVertical: 0,
  },
  memberChipRow: {
    gap: 8,
    paddingTop: 2,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 180,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: tavColors.zinc50,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
  },
  memberChipLabel: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: tavColors.zinc800,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: tavColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tavColors.zinc200,
  },
  rowSelected: {
    backgroundColor: tavColors.zinc50,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  rowMeta: {
    fontSize: 13,
    color: tavColors.zinc500,
    textTransform: 'capitalize',
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: tavColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tavColors.zinc200,
    backgroundColor: tavColors.white,
  },
});
