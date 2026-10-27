import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { authService } from '../../src/services';
import { useAuthStore } from '../../src/store/authStore';
import { Toast } from '../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';
import type { UserRole } from '../../src/types';

export default function VerifyOtp() {
  const { phone, role } = useLocalSearchParams<{ phone: string; role: UserRole }>();
  const { colors } = useTheme();
  const setAuth = useAuthStore((s) => s.setAuth);
  const inputRef = useRef<TextInput>(null);
  const [otp,     setOtp]     = useState('');
  const [loading, setLoading] = useState(false);
  const [tick,    setTick]    = useState(60);

  useEffect(() => {
    if (tick <= 0) return;
    const t = setTimeout(() => setTick((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [tick]);

  const verify = async (code: string) => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { user, token } = await authService.verifyOtp(phone, code, role ?? 'customer');
      await setAuth(user, token);
      if (user.role === 'restaurant_owner') router.replace('/(restaurant)/');
      else if (user.role === 'rider')       router.replace('/(rider)/');
      else                                  router.replace('/(customer)/');
    } catch (e: unknown) {
      Toast.show((e as { message?: string })?.message ?? 'Invalid OTP', 'error');
      setOtp('');
    } finally { setLoading(false); }
  };

  const handleChange = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 6);
    setOtp(clean);
    if (clean.length === 6) verify(clean);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={s.inner}>
        {/* Header */}
        <Pressable onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.surface }, shadows.sm]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>

        {/* Icon */}
        <View style={s.iconWrap}>
          <View style={[s.iconCircle, { backgroundColor: palette.orangeBg }]}>
            <Text style={{ fontSize: 40 }}>📱</Text>
          </View>
        </View>

        <Text style={[s.title, { color: colors.textPrimary }]}>OTP Verification</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          We've sent a 6-digit code to{'\n'}
          <Text style={{ color: palette.orange, fontWeight: '600' }}>{phone}</Text>
        </Text>

        {/* OTP boxes */}
        <TextInput
          ref={inputRef} value={otp} onChangeText={handleChange}
          keyboardType="number-pad" maxLength={6}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} autoFocus
        />
        <Pressable onPress={() => inputRef.current?.focus()} style={s.boxes}>
          {Array.from({ length: 6 }).map((_, i) => {
            const filled = i < otp.length;
            const active = i === otp.length;
            return (
              <View key={i} style={[s.box, {
                borderColor: active ? palette.orange : filled ? palette.orange : colors.border,
                backgroundColor: filled ? palette.orangeBg : colors.surface,
              }, shadows.sm]}>
                <Text style={[s.boxChar, { color: colors.textPrimary }]}>{otp[i] ?? ''}</Text>
              </View>
            );
          })}
        </Pressable>

        {loading && (
          <View style={s.loadingRow}>
            <ActivityIndicator color={palette.orange} size="small" />
            <Text style={[s.loadingText, { color: colors.textSecondary }]}>Verifying…</Text>
          </View>
        )}

        {/* Resend */}
        <View style={s.resendRow}>
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.base }}>
            Didn't receive the code?{' '}
          </Text>
          <Pressable onPress={() => tick <= 0 && setTick(60)} disabled={tick > 0}>
            <Text style={[s.resendText, { color: tick > 0 ? colors.textTertiary : palette.orange }]}>
              {tick > 0 ? `Resend in ${tick}s` : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>

        {/* Manual verify button */}
        <Pressable onPress={() => verify(otp)} disabled={otp.length !== 6 || loading}
          style={[s.verifyBtn, { opacity: otp.length === 6 ? 1 : 0.4 }]}>
          <Text style={s.verifyText}>Verify & Continue</Text>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  inner:      { flex: 1, padding: spacing[5], alignItems: 'center', paddingTop: spacing[6] },

  backBtn:    { alignSelf: 'flex-start', width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },

  iconWrap:   { marginTop: spacing[8], marginBottom: spacing[4] },
  iconCircle: { width: 100, height: 100, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },

  title:      { fontSize: typography.sizes['2xl'], fontWeight: '700', textAlign: 'center' },
  sub:        { fontSize: typography.sizes.body, textAlign: 'center', marginTop: spacing[2], lineHeight: 24 },

  boxes:      { flexDirection: 'row', gap: spacing[2], marginTop: spacing[6], marginBottom: spacing[4] },
  box:        { width: 48, height: 56, borderWidth: 2, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  boxChar:    { fontSize: typography.sizes.xl, fontWeight: '700' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  loadingText:{ fontSize: typography.sizes.base },

  resendRow:  { flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] },
  resendText: { fontSize: typography.sizes.base, fontWeight: '600' },

  verifyBtn:  { flexDirection: 'row', backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], paddingHorizontal: spacing[8], alignItems: 'center', gap: spacing[2], marginTop: spacing[5], ...shadows.card },
  verifyText: { color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },
});
