import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { borderRadius, typography } from '@/theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  const { colors } = useTheme();
  const bgMap: Record<BadgeVariant, string> = {
    primary: colors.primary + '20',
    success: colors.success + '20',
    warning: colors.warning + '20',
    error: colors.error + '20',
    info: colors.info + '20',
    neutral: colors.border,
  };
  const textMap: Record<BadgeVariant, string> = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    neutral: colors.textSecondary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgMap[variant] }]}>
      <Text style={[styles.text, { color: textMap[variant] }]}>{label}</Text>
    </View>
  );
}

export function statusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'DELIVERED': return 'success';
    case 'CANCELLED': case 'REJECTED': case 'FAILED': return 'error';
    case 'ON_THE_WAY': case 'PICKED_UP': return 'info';
    case 'PREPARING': case 'READY_FOR_PICKUP': return 'warning';
    default: return 'neutral';
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
