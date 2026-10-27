import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { palette, radius, typography } from '../../theme';
import type { OrderStatus } from '../../types';

type Variant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export function Badge({ label, variant = 'neutral' }: { label: string; variant?: Variant }) {
  const { colors } = useTheme();
  const map: Record<Variant, { bg: string; text: string }> = {
    primary: { bg: palette.orangeBg,    text: palette.orange   },
    success: { bg: palette.successBg,   text: palette.success  },
    warning: { bg: '#FEF3C7',           text: '#92400E'        },
    error:   { bg: '#FEE2E2',           text: palette.error    },
    info:    { bg: '#DBEAFE',           text: palette.info     },
    neutral: { bg: colors.background,   text: colors.textSecondary },
  };
  const c = map[variant];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

export function statusVariant(status: OrderStatus): Variant {
  if (['DELIVERED'].includes(status))                        return 'success';
  if (['CANCELLED','REJECTED','FAILED'].includes(status))   return 'error';
  if (['ON_THE_WAY','PICKED_UP'].includes(status))          return 'primary';
  if (['PREPARING','READY_FOR_PICKUP'].includes(status))    return 'warning';
  if (['ACCEPTED'].includes(status))                         return 'info';
  return 'neutral';
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  text:  { fontSize: typography.sizes.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
