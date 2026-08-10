import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { Archive, ArchiveRestore } from '@/components/icons/lucide';
import { ThreadRow } from '@/components/inbox/thread-row';
import { tavColors } from '@/lib/theme';
import type { Thread } from '@/types/messaging';

export type ThreadSwipeAction = 'mark-done' | 'reopen';

type SwipeableThreadRowProps = {
  thread: Thread;
  readAt?: string | null;
  swipeAction: ThreadSwipeAction;
  onPress: () => void;
  onLongPress: () => void;
  onSwipeAction: () => void | Promise<void>;
};

const ACTION_WIDTH = 88;

export function SwipeableThreadRow({
  thread,
  readAt,
  swipeAction,
  onPress,
  onLongPress,
  onSwipeAction,
}: SwipeableThreadRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const isMarkDone = swipeAction === 'mark-done';

  const handleAction = () => {
    swipeableRef.current?.close();
    void onSwipeAction();
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-ACTION_WIDTH, 0],
      outputRange: [0, ACTION_WIDTH],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.actionContainer, { transform: [{ translateX }] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isMarkDone ? 'Mark deal done' : 'Reopen deal'}
          onPress={handleAction}
          style={({ pressed }) => [
            styles.actionButton,
            isMarkDone ? styles.actionDone : styles.actionReopen,
            pressed && styles.actionPressed,
          ]}>
          {isMarkDone ? (
            <Archive color={tavColors.white} size={20} strokeWidth={2.2} />
          ) : (
            <ArchiveRestore color={tavColors.white} size={20} strokeWidth={2.2} />
          )}
          <Text style={styles.actionLabel}>{isMarkDone ? 'Done' : 'Reopen'}</Text>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootFriction={8}
      overshootRight={false}
      rightThreshold={ACTION_WIDTH * 0.45}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') {
          handleAction();
        }
      }}>
      <ThreadRow
        thread={thread}
        readAt={readAt}
        onPress={onPress}
        onLongPress={onLongPress}
      />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionContainer: {
    width: ACTION_WIDTH,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  actionDone: {
    backgroundColor: tavColors.green600,
  },
  actionReopen: {
    backgroundColor: tavColors.blue,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    color: tavColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
