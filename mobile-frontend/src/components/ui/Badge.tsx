import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, typography } from '@/theme';
import type { OrderStatus } from '@/types';

type Variant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export function Badge({ label, variant = 'neutral' }: { label: string; variant?: Variant }) {
  const { colors } = useTheme();
  const map: Record<Variant, { bg: string; text: string }> = {
    primary: { bg: colors.primary + '22', text: colors.primary },
    success: { bg: colors.success + '22', text: colors.success },
    warning: { bg: colors.warning + '22', text: colors.warning },
    error:   { bg: colors.error   + '22', text: colors.error   },
    info:    { bg: colors.info    + '22', text: colors.info    },
    neutral: { bg: colors.border,         text: colors.textSecondary },
  };
  const c = map[variant];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function statusVariant(status: OrderStatus): Variant {
  if (['DELIVERED'].includes(status)) return 'success';
  if (['CANCELLED', 'REJECTED', 'FAILED'].includes(status)) return 'error';
  if (['ON_THE_WAY', 'PICKED_UP'].includes(status)) return 'info';
  if (['PREPARING', 'READY_FOR_PICKUP'].includes(status)) return 'warning';
  return 'neutral';
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  text:  { fontSize: typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
