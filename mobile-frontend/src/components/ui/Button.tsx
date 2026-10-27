import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { palette, radius, spacing, typography, shadows } from '../../theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'secondary';
type Size    = 'sm' | 'md' | 'lg';

interface Props {
  title: string; onPress: () => void;
  variant?: Variant; size?: Size;
  loading?: boolean; disabled?: boolean;
  fullWidth?: boolean; style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, fullWidth, style }: Props) {
  const { colors } = useTheme();
  const off = disabled || loading;

  const bg: Record<Variant, string> = {
    primary:   palette.orange,
    secondary: colors.background,
    outline:   'transparent',
    ghost:     'transparent',
    danger:    palette.error,
  };
  const tc: Record<Variant, string> = {
    primary:   '#fff',
    secondary: colors.textPrimary,
    outline:   palette.orange,
    ghost:     colors.textPrimary,
    danger:    '#fff',
  };
  const bc: Record<Variant, string> = {
    primary:   'transparent',
    secondary: colors.border,
    outline:   palette.orange,
    ghost:     'transparent',
    danger:    'transparent',
  };
  const pv: Record<Size, number> = { sm: spacing[2], md: spacing[3], lg: spacing[4] };
  const ph: Record<Size, number> = { sm: spacing[3], md: spacing[5], lg: spacing[6] };
  const fs: Record<Size, number> = { sm: typography.sizes.sm, md: typography.sizes.base, lg: typography.sizes.body };

  return (
    <Pressable onPress={onPress} disabled={off}
      style={({ pressed }) => [
        s.base,
        {
          backgroundColor: bg[variant],
          borderColor: bc[variant],
          paddingVertical: pv[size],
          paddingHorizontal: ph[size],
          opacity: off ? 0.45 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        variant === 'primary' && shadows.card,
        style,
      ]}>
      {loading
        ? <ActivityIndicator color={tc[variant]} size="small" />
        : <Text style={[s.label, { color: tc[variant], fontSize: fs[size] }]}>{title}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base:  { borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '700', textAlign: 'center' },
});
