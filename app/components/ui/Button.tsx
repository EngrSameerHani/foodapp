import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { borderRadius, spacing, typography } from '@/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();

  const bgMap: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: 'transparent',
    ghost: 'transparent',
    danger: colors.error,
  };

  const textColorMap: Record<Variant, string> = {
    primary: '#fff',
    secondary: '#fff',
    outline: colors.primary,
    ghost: colors.textPrimary,
    danger: '#fff',
  };

  const borderColorMap: Record<Variant, string> = {
    primary: 'transparent',
    secondary: 'transparent',
    outline: colors.primary,
    ghost: 'transparent',
    danger: 'transparent',
  };

  const sizeMap: Record<Size, { paddingH: number; paddingV: number; fontSize: number }> = {
    sm: { paddingH: spacing[3], paddingV: spacing[2], fontSize: typography.sizes.sm },
    md: { paddingH: spacing[5], paddingV: spacing[3], fontSize: typography.sizes.md },
    lg: { paddingH: spacing[6], paddingV: spacing[4], fontSize: typography.sizes.lg },
  };

  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgMap[variant],
          borderColor: borderColorMap[variant],
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColorMap[variant]} size="small" />
      ) : (
        <Text style={[styles.text, { color: textColorMap[variant], fontSize: s.fontSize }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});
