import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@ody/shared';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={[styles.root, isMobile && styles.rootMobile]}>
      <Sidebar />
      <View style={styles.main}>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.neutral[50],
  },
  rootMobile: {
    flexDirection: 'column-reverse',
  },
  main: {
    flex: 1,
    overflow: 'hidden',
  },
});
