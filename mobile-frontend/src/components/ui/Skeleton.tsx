import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing } from '../../theme';

export function Skeleton({ width = '100%', height = 16, br = radius.md, style }: { width?: number | string; height?: number; br?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 750, useNativeDriver: true }),
    ])).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  return <Animated.View style={[{ width: width as number, height, borderRadius: br, backgroundColor: colors.skeleton, opacity }, style]} />;
}

export function CardSkeleton() {
  return (
    <View style={{ marginBottom: spacing[4], gap: spacing[2] }}>
      <Skeleton height={160} br={16} />
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={13} />
    </View>
  );
}
