import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', loading, disabled, fullWidth, style }: Props) {
  const { colors } = useTheme();
  const off = disabled || loading;

  const bg: Record<Variant, string> = {
    primary: colors.primary, outline: 'transparent', ghost: 'transparent', danger: colors.error,
  };
  const tc: Record<Variant, string> = {
    primary: '#fff', outline: colors.primary, ghost: colors.textPrimary, danger: '#fff',
  };
  const bc: Record<Variant, string> = {
    primary: 'transparent', outline: colors.primary, ghost: 'transparent', danger: 'transparent',
  };
  const pv: Record<Size, number> = { sm: spacing[2], md: spacing[3], lg: spacing[4] };
  const ph: Record<Size, number> = { sm: spacing[3], md: spacing[5], lg: spacing[6] };
  const fs: Record<Size, number> = { sm: typography.sizes.sm, md: typography.sizes.md, lg: typography.sizes.lg };

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        s.base,
        { backgroundColor: bg[variant], borderColor: bc[variant], paddingVertical: pv[size], paddingHorizontal: ph[size], opacity: off ? 0.5 : pressed ? 0.82 : 1, width: fullWidth ? '100%' : undefined },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={tc[variant]} size="small" />
        : <Text style={[s.label, { color: tc[variant], fontSize: fs[size] }]}>{title}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base:  { borderRadius: radius.full, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '600', textAlign: 'center' },
});
