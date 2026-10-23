import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing } from '@/theme';

export function Skeleton({ width = '100%', height = 16, br = radius.sm, style }: { width?: number | string; height?: number; br?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  return <Animated.View style={[{ width: width as number, height, borderRadius: br, backgroundColor: colors.skeleton, opacity }, style]} />;
}

export function CardSkeleton() {
  return (
    <View style={{ marginBottom: spacing[4], gap: 8 }}>
      <Skeleton height={160} br={12} />
      <Skeleton width="65%" height={14} />
      <Skeleton width="45%" height={12} />
    </View>
  );
}
