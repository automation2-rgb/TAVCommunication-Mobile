import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { AuthButton } from '@/components/auth/auth-button';
import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import {
  getNotificationPermissionStatus,
  openSystemNotificationSettings,
  syncDevicePushRegistration,
  type NotificationPermissionStatus,
} from '@/lib/push/notifications';
import {
  getNotifySoundEnabled,
  setNotifySoundEnabled,
} from '@/lib/settings/local-preferences';
import { tavColors } from '@/lib/theme';

function permissionLabel(status: NotificationPermissionStatus | null) {
  switch (status) {
    case 'granted':
      return 'Allowed';
    case 'denied':
      return 'Denied';
    case 'undetermined':
      return 'Not decided';
    default:
      return 'Checking…';
  }
}

export default function SettingsScreen() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus | null>(
    null,
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setErrorMessage(null);
    try {
      const [status, sound] = await Promise.all([
        getNotificationPermissionStatus(),
        getNotifySoundEnabled(),
      ]);
      setPermissionStatus(status);
      setSoundEnabled(sound);
    } catch {
      setErrorMessage('Unable to load notification settings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      void refresh();
    }, [refresh]),
  );

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    setErrorMessage(null);
    try {
      await syncDevicePushRegistration();
      await refresh();
    } catch {
      setErrorMessage('Unable to enable notifications. Try again or open system settings.');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleSoundToggle = async (next: boolean) => {
    setSoundEnabled(next);
    await setNotifySoundEnabled(next);
  };

  return (
    <SupportScreenShell title="Settings" padded={false}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.sectionDescription}>
            Inbound SMS alerts use system notifications. Your device must allow them for this app.
          </Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Permission</Text>
              {isLoading ? (
                <ActivityIndicator color={tavColors.blue} />
              ) : (
                <Text style={styles.rowValue}>{permissionLabel(permissionStatus)}</Text>
              )}
            </View>

            {permissionStatus === 'undetermined' ? (
              <AuthButton
                disabled={isEnabling}
                label={isEnabling ? 'Enabling…' : 'Enable notifications'}
                onPress={() => {
                  void handleEnableNotifications();
                }}
              />
            ) : null}

            {permissionStatus === 'denied' ? (
              <>
                <Text style={styles.hint}>
                  Notifications are blocked. Enable them in system settings, then return here.
                </Text>
                <AuthButton
                  label="Open system settings"
                  variant="secondary"
                  onPress={() => {
                    void openSystemNotificationSettings();
                  }}
                />
              </>
            ) : null}

            {permissionStatus === 'granted' ? (
              <AuthButton
                label="Open system settings"
                variant="secondary"
                onPress={() => {
                  void openSystemNotificationSettings();
                }}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound</Text>
          <Text style={styles.sectionDescription}>
            Controls sound for inbound alerts while the app is open. Background alerts use the OS
            channel sound.
          </Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowLabel}>Play sound for inbound alerts</Text>
              </View>
              <Switch
                accessibilityLabel="Play sound for inbound alerts"
                trackColor={{ false: tavColors.zinc200, true: tavColors.blue }}
                thumbColor={tavColors.white}
                value={soundEnabled}
                onValueChange={(next) => {
                  void handleSoundToggle(next);
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SupportScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 24,
    paddingBottom: 32,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: tavColors.zinc900,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc600,
  },
  card: {
    backgroundColor: tavColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tavColors.zinc200,
    padding: 14,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: tavColors.zinc900,
  },
  rowValue: {
    fontSize: 15,
    color: tavColors.zinc600,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: tavColors.zinc500,
  },
  errorBanner: {
    backgroundColor: tavColors.red50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
  },
  errorText: {
    color: tavColors.red600,
    fontSize: 14,
    lineHeight: 20,
  },
});
