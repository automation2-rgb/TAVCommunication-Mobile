import { StyleSheet, View } from 'react-native';

import { getInboxVisualIdentity } from '@/lib/inbox/inbox-visual-identity';
import { tavColors, tavLayout } from '@/lib/theme';

type InboxIconTileProps = {
  inboxId: string;
  size?: number;
  selected?: boolean;
  unread?: boolean;
};

export function InboxIconTile({
  inboxId,
  size = tavLayout.inboxTileLg,
  selected = false,
  unread = false,
}: InboxIconTileProps) {
  const { backgroundColor, iconColor, Icon } = getInboxVisualIdentity(inboxId);
  const iconSize = Math.round(size * 0.45);

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor,
        },
        selected && styles.selected,
        unread && !selected && styles.unread,
      ]}>
      <Icon color={iconColor} size={iconSize} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderWidth: 2,
    borderColor: tavColors.zinc900,
  },
  unread: {
    borderWidth: 2,
    borderColor: tavColors.link,
  },
});
