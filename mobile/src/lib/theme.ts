import { Platform, TextStyle, ViewStyle } from 'react-native';

export const tavColors = {
  zinc950: '#09090b',
  zinc900: '#18181b',
  zinc800: '#27272a',
  zinc700: '#3f3f46',
  zinc600: '#52525b',
  zinc500: '#71717a',
  zinc400: '#a1a1aa',
  zinc300: '#d4d4d8',
  zinc200: '#e4e4e7',
  zinc100: '#f4f4f5',
  zinc50: '#fafafa',
  white: '#ffffff',
  black: '#000000',
  blue: '#0a84ff',
  blueHover: '#0b76e8',
  link: '#0a84ff',
  bubbleIn: '#e5e5ea',
  bubbleOut: '#0a84ff',
  bubbleOutGradientTop: '#3498ff',
  bubbleOutGradientMid: '#0a84ff',
  bubbleOutGradientBottom: '#107eef',
  bubbleOutDim: 'rgba(255,255,255,0.72)',
  composerSlab: '#f2f2f7',
  threadListBg: '#f8f8f8',
  canvas: '#ffffff',
  red600: '#dc2626',
  red700: '#b91c1c',
  red50: '#fef2f2',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber800: '#92400e',
  amber900: '#78350f',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  green500: '#22c55e',
  green600: '#16a34a',
  green100: '#dcfce7',
  green800: '#166534',
} as const;

export const tavLayout = {
  headerHeight: 52,
  sendButtonSize: 40,
  iconButtonSize: 40,
  composerRadius: 22,
  bubbleRadiusLarge: 20,
  bubbleRadiusTail: 6,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 48,
  userAvatar: 32,
  inboxTileLg: 44,
  maxBubbleWidthRatio: 0.92,
} as const;

export const tavTypography = {
  messageBody: {
    fontSize: 16,
    lineHeight: 24,
  } satisfies TextStyle,
  composerInput: {
    fontSize: 14,
    lineHeight: 20,
  } satisfies TextStyle,
  threadTitle: {
    fontSize: 14,
    fontWeight: '600',
  } satisfies TextStyle,
  threadTitleUnread: {
    fontSize: 14,
    fontWeight: '700',
    color: tavColors.zinc900,
  } satisfies TextStyle,
  threadSnippet: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc600,
  } satisfies TextStyle,
  meta: {
    fontSize: 11,
    lineHeight: 14,
    color: tavColors.zinc500,
  } satisfies TextStyle,
  metaSmall: {
    fontSize: 10,
    lineHeight: 12,
  } satisfies TextStyle,
  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: tavColors.zinc900,
  } satisfies TextStyle,
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: tavColors.zinc900,
  } satisfies TextStyle,
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: tavColors.zinc900,
  } satisfies TextStyle,
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: tavColors.zinc600,
  } satisfies TextStyle,
} as const;

export const tavShadows = {
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 3 },
    default: {},
  }),
  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
} as const;

export const pressScaleStyle = (pressed: boolean) => ({
  transform: [{ scale: pressed ? 0.985 : 1 }],
});

export function outboundBubbleRadii() {
  return {
    borderTopLeftRadius: tavLayout.bubbleRadiusLarge,
    borderTopRightRadius: tavLayout.bubbleRadiusLarge,
    borderBottomLeftRadius: tavLayout.bubbleRadiusLarge,
    borderBottomRightRadius: tavLayout.bubbleRadiusTail,
  };
}

export function inboundBubbleRadii() {
  return {
    borderTopLeftRadius: tavLayout.bubbleRadiusLarge,
    borderTopRightRadius: tavLayout.bubbleRadiusLarge,
    borderBottomRightRadius: tavLayout.bubbleRadiusLarge,
    borderBottomLeftRadius: tavLayout.bubbleRadiusTail,
  };
}
