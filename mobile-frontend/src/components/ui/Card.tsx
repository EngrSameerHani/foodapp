import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, shadows, spacing } from '@/theme';

export function Card({ children, style, padding = spacing[4] }: { children: React.ReactNode; style?: ViewStyle; padding?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: colors.surface, padding }, shadows.md, style]}>
      {children}
    </View>
  );
}
const s = StyleSheet.create({ card: { borderRadius: radius.lg, overflow: 'hidden' } });
