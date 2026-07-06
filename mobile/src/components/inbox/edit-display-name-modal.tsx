import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { tavColors } from '@/lib/theme';

type EditDisplayNameModalProps = {
  visible: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
};

export function EditDisplayNameModal({ visible, initialValue, onClose, onSave }: EditDisplayNameModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
    }
  }, [initialValue, visible]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Display name</Text>
          <TextInput
            autoFocus
            placeholder="Leave blank to use phone number"
            placeholderTextColor={tavColors.zinc500}
            style={styles.input}
            value={value}
            onChangeText={setValue}
          />
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.button}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onSave(value);
                onClose();
              }}
              style={styles.button}>
              <Text style={styles.save}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: tavColors.white,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
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
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cancel: {
    fontSize: 16,
    color: tavColors.zinc600,
  },
  save: {
    fontSize: 16,
    fontWeight: '600',
    color: tavColors.blue,
  },
});
