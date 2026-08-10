import { Tabs } from 'expo-router';

import { AppTabBar } from '@/components/navigation/app-tab-bar';
import { PushNotificationBootstrap } from '@/components/push/push-notification-bootstrap';
import { InCallOverlay } from '@/components/voice/in-call-overlay';
import { ChatAttentionProvider } from '@/contexts/chat-attention';
import { ChatConversationsProvider } from '@/contexts/chat-conversations';
import { InboxWorkspaceProvider } from '@/contexts/inbox-workspace';
import { MissedCallsProvider } from '@/contexts/missed-calls';
import { TabBarVisibilityProvider } from '@/contexts/tab-bar-visibility';
import { VoiceClientProvider } from '@/contexts/voice-client';
import { useAuth } from '@/lib/auth/auth-provider';
import { tavColors } from '@/lib/theme';

function AppTabs() {
  const { session, profile } = useAuth();
  const voiceEnabled = profile?.approval_status === 'approved' && Boolean(session);

  return (
    <VoiceClientProvider enabled={voiceEnabled}>
      <MissedCallsProvider enabled={voiceEnabled}>
        <ChatAttentionProvider enabled={voiceEnabled}>
          <ChatConversationsProvider enabled={Boolean(session)}>
            <InboxWorkspaceProvider userId={session?.user.id}>
              <TabBarVisibilityProvider>
                <PushNotificationBootstrap />
                <Tabs
                  tabBar={(props) => <AppTabBar {...props} />}
                  screenOptions={{
                    headerShown: false,
                    tabBarStyle: { backgroundColor: tavColors.white },
                  }}>
                  <Tabs.Screen name="inbox" options={{ title: 'Text' }} />
                  <Tabs.Screen name="chat" options={{ title: 'Chats' }} />
                  <Tabs.Screen name="calls/index" options={{ title: 'Calls' }} />
                  <Tabs.Screen name="contacts/index" options={{ title: 'Contacts' }} />
                  <Tabs.Screen name="profile/index" options={{ title: 'Profile' }} />
                  <Tabs.Screen name="settings/index" options={{ href: null }} />
                  <Tabs.Screen name="help/index" options={{ href: null }} />
                </Tabs>
                <InCallOverlay />
              </TabBarVisibilityProvider>
            </InboxWorkspaceProvider>
          </ChatConversationsProvider>
        </ChatAttentionProvider>
      </MissedCallsProvider>
    </VoiceClientProvider>
  );
}

export default function AppLayout() {
  return <AppTabs />;
}
