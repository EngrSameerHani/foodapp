import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { radius, shadows, spacing } from '../../theme';

interface Props { children: React.ReactNode; style?: ViewStyle; padding?: number; elevated?: boolean; }

export function Card({ children, style, padding = spacing[4], elevated = true }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[s.card, { backgroundColor: colors.surface, padding }, elevated && shadows.md, style]}>
      {children}
    </View>
  );
}
const s = StyleSheet.create({ card: { borderRadius: radius.xl } });
