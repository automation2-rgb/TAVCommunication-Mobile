import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/lib/auth/auth-provider';
import { useAuthRedirect } from '@/lib/auth/use-auth-redirect';
import '@/lib/push/notifications';

function AuthNavigationGuard() {
  useAuthRedirect();
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthNavigationGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="auth/callback" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
