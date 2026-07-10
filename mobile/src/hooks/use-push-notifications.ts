import { Href, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { useInboxWorkspace } from '@/contexts/inbox-workspace';
import {
  isPushSupported,
  parsePushNotificationData,
  registerDevicePushToken,
  syncDevicePushRegistration,
} from '@/lib/push/notifications';

type UsePushNotificationsOptions = {
  enabled: boolean;
};

function navigateToPushTarget(
  router: ReturnType<typeof useRouter>,
  setActiveInboxId: (inboxId: string) => void,
  data: Record<string, unknown> | undefined,
) {
  const target = parsePushNotificationData(data);
  if (!target) {
    return;
  }

  setActiveInboxId(target.inboxId);
  router.push(`/(app)/inbox/${target.threadId}` as Href);
}

export function usePushNotifications({ enabled }: UsePushNotificationsOptions) {
  const router = useRouter();
  const { setActiveInboxId } = useInboxWorkspace();
  const handledColdStartRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isPushSupported()) {
      return;
    }

    let cancelled = false;

    void syncDevicePushRegistration().catch(() => {
      // Permission denied or token unavailable; user can enable later in OS settings.
    });

    const pushTokenSubscription = Notifications.addPushTokenListener((event) => {
      const nextToken = event.data?.trim();
      if (!nextToken || cancelled) {
        return;
      }

      void registerDevicePushToken(nextToken).catch(() => {
        // Retry on next app launch or token rotation.
      });
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateToPushTarget(
        router,
        setActiveInboxId,
        response.notification.request.content.data as Record<string, unknown> | undefined,
      );
    });

    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (cancelled || handledColdStartRef.current || !response) {
          return;
        }

        handledColdStartRef.current = true;
        navigateToPushTarget(
          router,
          setActiveInboxId,
          response.notification.request.content.data as Record<string, unknown> | undefined,
        );
      })
      .catch(() => {
        // Ignore cold-start notification lookup failures.
      });

    return () => {
      cancelled = true;
      pushTokenSubscription.remove();
      responseSubscription.remove();
    };
  }, [enabled, router, setActiveInboxId]);
}
