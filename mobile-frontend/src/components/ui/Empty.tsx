import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { palette, radius, spacing, typography, shadows } from '../../theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string; message?: string;
  actionLabel?: string; onAction?: () => void;
}

export function Empty({ icon = 'alert-circle-outline', title, message, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <View style={[s.iconBox, { backgroundColor: palette.orangeBg }]}>
        <Ionicons name={icon} size={48} color={palette.orange} />
      </View>
      <Text style={[s.title, { color: colors.textPrimary }]}>{title}</Text>
      {message && <Text style={[s.msg, { color: colors.textSecondary }]}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={[s.btn, shadows.card]}>
          <Text style={s.btnTxt}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8], gap: spacing[4] },
  iconBox:{ width: 100, height: 100, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  title:  { fontSize: typography.sizes.xl, fontWeight: '700', textAlign: 'center' },
  msg:    { fontSize: typography.sizes.body, textAlign: 'center', lineHeight: 24 },
  btn:    { backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[3], paddingHorizontal: spacing[6] },
  btnTxt: { color: '#fff', fontSize: typography.sizes.base, fontWeight: '700' },
});
