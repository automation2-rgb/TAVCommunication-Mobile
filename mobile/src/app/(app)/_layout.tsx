import { Stack } from 'expo-router';

import { PushNotificationBootstrap } from '@/components/push/push-notification-bootstrap';
import { MissedCallsProvider } from '@/contexts/missed-calls';
import { VoiceClientProvider } from '@/contexts/voice-client';
import { InboxWorkspaceProvider } from '@/contexts/inbox-workspace';
import { useAuth } from '@/lib/auth/auth-provider';

function AppStack() {
  const { session, profile } = useAuth();
  const voiceEnabled = profile?.approval_status === 'approved' && Boolean(session);

  return (
    <VoiceClientProvider enabled={voiceEnabled}>
      <MissedCallsProvider enabled={voiceEnabled}>
        <InboxWorkspaceProvider userId={session?.user.id}>
          <PushNotificationBootstrap />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="inbox" />
            <Stack.Screen name="calls/index" />
            <Stack.Screen name="contacts/index" />
            <Stack.Screen name="profile/index" />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="help/index" />
          </Stack>
        </InboxWorkspaceProvider>
      </MissedCallsProvider>
    </VoiceClientProvider>
  );
}

export default function AppLayout() {
  return <AppStack />;
}
