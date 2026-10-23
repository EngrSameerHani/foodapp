/**
 * Lightweight in-app toast — no extra package needed.
 * Usage: Toast.show('Message') from anywhere via the ref.
 */
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius, spacing, typography } from '@/theme';

export interface ToastRef {
  show: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ToastView = forwardRef<ToastRef>((_, ref) => {
  const { colors } = useTheme();
  const [msg, setMsg]     = useState('');
  const [type, setType]   = useState<'success' | 'error' | 'info'>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const timer   = useRef<ReturnType<typeof setTimeout>>();

  useImperativeHandle(ref, () => ({
    show: (m, t = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setMsg(m); setType(t);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
      }, 2800);
    },
  }));

  const bg = type === 'success' ? colors.success : type === 'error' ? colors.error : colors.info;

  return (
    <Animated.View style={[s.toast, { backgroundColor: bg, opacity }]} pointerEvents="none">
      <Text style={s.text}>{msg}</Text>
    </Animated.View>
  );
});

ToastView.displayName = 'ToastView';

// Global singleton pattern
let _ref: ToastRef | null = null;
export const Toast = {
  setRef: (r: ToastRef | null) => { _ref = r; },
  show:   (msg: string, type?: 'success' | 'error' | 'info') => _ref?.show(msg, type),
};

const s = StyleSheet.create({
  toast: { position: 'absolute', bottom: 90, left: spacing[4], right: spacing[4], borderRadius: radius.lg, padding: spacing[4], zIndex: 9999 },
  text:  { color: '#fff', fontSize: typography.sizes.base, fontWeight: '600', textAlign: 'center' },
});
