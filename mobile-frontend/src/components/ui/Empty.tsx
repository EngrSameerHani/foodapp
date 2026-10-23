import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography } from '@/theme';
import { Button } from './Button';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Empty({ icon = 'alert-circle-outline', title, message, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <Ionicons name={icon} size={64} color={colors.textTertiary} />
      <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
      {message && <Text style={[s.msg, { color: colors.textSecondary }]}>{message}</Text>}
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing[4] }} />}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8], gap: spacing[2] },
  title: { fontSize: typography.sizes.lg, fontWeight: '600', textAlign: 'center', marginTop: spacing[2] },
  msg:   { fontSize: typography.sizes.base, textAlign: 'center', lineHeight: 22 },
});
