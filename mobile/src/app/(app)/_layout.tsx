import { Stack } from 'expo-router';

import { InboxWorkspaceProvider } from '@/contexts/inbox-workspace';
import { useAuth } from '@/lib/auth/auth-provider';

function AppStack() {
  const { session } = useAuth();

  return (
    <InboxWorkspaceProvider userId={session?.user.id}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="inbox" />
        <Stack.Screen name="contacts/index" />
        <Stack.Screen name="profile/index" />
        <Stack.Screen name="settings/index" />
        <Stack.Screen name="help/index" />
      </Stack>
    </InboxWorkspaceProvider>
  );
}

export default function AppLayout() {
  return <AppStack />;
}
