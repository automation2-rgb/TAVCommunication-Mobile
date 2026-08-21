import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  MessageSquare,
  MessagesSquare,
  Phone,
  User,
  Users,
  type LucideIcon,
} from '@/components/icons/lucide';
import { formatChatBadgeCount, useChatAttention } from '@/contexts/chat-attention';
import { formatInboxBadgeCount, useInboxAttention } from '@/contexts/inbox-attention';
import { formatMissedBadgeCount, useMissedCalls } from '@/contexts/missed-calls';
import { useTabBarVisibility } from '@/contexts/tab-bar-visibility';
import { pressScaleStyle, tavColors } from '@/lib/theme';

type TabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault?: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

type TabConfig = {
  label: string;
  icon: LucideIcon;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  inbox: { label: 'Text', icon: MessageSquare },
  chat: { label: 'Chats', icon: MessagesSquare },
  'calls/index': { label: 'Calls', icon: Phone },
  'contacts/index': { label: 'Contacts', icon: Users },
  'profile/index': { label: 'Profile', icon: User },
};

export function AppTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { isTabBarHidden } = useTabBarVisibility();
  const { unseenMissedCount } = useMissedCalls();
  const { unreadConversationCount } = useChatAttention();
  const { totalUnreadCount } = useInboxAttention();

  if (isTabBarHidden) {
    return null;
  }

  const missedBadge = formatMissedBadgeCount(unseenMissedCount);
  const chatBadge = formatChatBadgeCount(unreadConversationCount);
  const textBadge = formatInboxBadgeCount(totalUnreadCount);

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name];
        if (!config) {
          return null;
        }

        const focused = state.index === index;
        const Icon = config.icon;
        const badge =
          route.name === 'inbox'
            ? textBadge
            : route.name === 'calls/index'
              ? missedBadge
              : route.name === 'chat'
                ? chatBadge
                : null;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={({ pressed }) => [styles.tab, pressScaleStyle(pressed)]}>
            <View style={styles.iconWrap}>
              <Icon
                color={focused ? tavColors.blue : tavColors.zinc500}
                size={22}
                strokeWidth={focused ? 2.4 : 2}
              />
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, focused && styles.labelFocused]}>{config.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tavColors.zinc200,
    backgroundColor: tavColors.white,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: tavColors.zinc500,
  },
  labelFocused: {
    color: tavColors.blue,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: tavColors.amber500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: tavColors.white,
  },
});
