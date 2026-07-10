import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useAuth } from '@/lib/auth/auth-provider';

export function PushNotificationBootstrap() {
  const { profile } = useAuth();
  const enabled = profile?.approval_status === 'approved';

  usePushNotifications({ enabled });

  return null;
}
