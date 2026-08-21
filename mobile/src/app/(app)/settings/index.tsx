import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { AuthButton } from '@/components/auth/auth-button';
import { SupportScreenShell } from '@/components/workspace/support-screen-shell';
import {
  SupportBanner,
  SupportCard,
  SupportScrollContent,
  SupportSection,
  SupportSettingRow,
} from '@/components/workspace/support-screen-ui';
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
    <SupportScreenShell title="Settings" padded={false} showBack backLabel="Profile">
      <ScrollView contentContainerStyle={styles.scrollGrow}>
        <SupportScrollContent>
          {errorMessage ? <SupportBanner variant="error">{errorMessage}</SupportBanner> : null}

          <SupportSection
            description="Inbound SMS alerts use system notifications. Your device must allow them for this app."
            title="Notifications">
            <SupportCard>
              <SupportSettingRow
                label="Permission"
                right={
                  isLoading ? (
                    <ActivityIndicator color={tavColors.blue} />
                  ) : (
                    <Text style={styles.valueText}>{permissionLabel(permissionStatus)}</Text>
                  )
                }
              />

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
            </SupportCard>
          </SupportSection>

          <SupportSection
            description="Controls sound for inbound alerts while the app is open. Background alerts use the OS channel sound."
            title="Sound">
            <SupportCard>
              <SupportSettingRow
                description="Play a sound when a message arrives in the foreground."
                label="Inbound alert sound"
                right={
                  <Switch
                    accessibilityLabel="Play sound for inbound alerts"
                    trackColor={{ false: tavColors.zinc200, true: tavColors.blue }}
                    thumbColor={tavColors.white}
                    value={soundEnabled}
                    onValueChange={(next) => {
                      void handleSoundToggle(next);
                    }}
                  />
                }
              />
            </SupportCard>
          </SupportSection>
        </SupportScrollContent>
      </ScrollView>
    </SupportScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollGrow: {
    flexGrow: 1,
  },
  valueText: {
    fontSize: 15,
    fontWeight: '500',
    color: tavColors.zinc600,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: tavColors.zinc500,
  },
});
