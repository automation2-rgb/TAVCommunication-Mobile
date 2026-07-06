import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { tavColors } from '@/lib/theme';

type LoadingScreenProps = {
  dark?: boolean;
};

export function LoadingScreen({ dark = false }: LoadingScreenProps) {
  return (
    <View style={[styles.container, dark ? styles.dark : styles.light]}>
      <ActivityIndicator color={dark ? tavColors.white : tavColors.blue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dark: {
    backgroundColor: tavColors.zinc950,
  },
  light: {
    backgroundColor: tavColors.zinc50,
  },
});
