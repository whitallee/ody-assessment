import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewProps } from 'react-native';
import { colors, radius } from '@ody/shared';

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
  ...props
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.neutral[200], opacity }, style]}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={skeletonStyles.card}>
      <Skeleton width="40%" height={14} />
      <View style={{ height: 8 }} />
      <Skeleton height={28} />
      <View style={{ height: 12 }} />
      <Skeleton width="60%" height={12} />
    </View>
  );
}

export function SkeletonRow() {
  return (
    <View style={skeletonStyles.row}>
      <Skeleton width={32} height={32} borderRadius={radius.full} />
      <View style={skeletonStyles.rowContent}>
        <Skeleton width="50%" height={13} />
        <View style={{ height: 6 }} />
        <Skeleton width="30%" height={11} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowContent: { flex: 1 },
});
