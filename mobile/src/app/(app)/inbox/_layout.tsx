import { Stack } from 'expo-router';

export default function InboxLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[threadId]" />
      <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
