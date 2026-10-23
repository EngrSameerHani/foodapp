import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { spacing, typography, borderRadius } from '@/theme';
import type { UserRole } from '@/types/api';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function VerifyOtp() {
  const { phone, role } = useLocalSearchParams<{ phone: string; role: UserRole }>();
  const { colors } = useTheme();
  const { setTokens, setUser } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    try {
      const { data: tokens } = await authApi.verifyOtp(phone, otp, role ?? 'customer');
      await setTokens(tokens.access_token, tokens.refresh_token);
      const { data: user } = await authApi.getMe();
      setUser(user);

      // Navigate based on role
      if (user.role === 'restaurant_owner') router.replace('/(restaurant)/');
      else if (user.role === 'rider') router.replace('/(rider)/');
      else router.replace('/(customer)/');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Verification failed';
      Toast.show({ type: 'error', text1: msg });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await authApi.requestOtp(phone);
      setCountdown(RESEND_SECONDS);
      setOtp('');
      Toast.show({ type: 'success', text1: 'OTP resent' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to resend OTP' });
    }
  };

  // Auto-verify when all digits entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH) handleVerify();
  }, [otp]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-start', padding: spacing[1] }}>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.base }}>← Back</Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.textPrimary }]}>Enter OTP</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a 6-digit code to {phone}
        </Text>

        {/* Hidden input drives the OTP boxes */}
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, OTP_LENGTH))}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={styles.hiddenInput}
          autoFocus
        />

        <Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow}>
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.otpBox,
                {
                  borderColor: i === otp.length ? colors.primary : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text style={[styles.otpChar, { color: colors.textPrimary }]}>
                {otp[i] ?? ''}
              </Text>
            </View>
          ))}
        </Pressable>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[4] }} />}

        <View style={styles.resendRow}>
          <Text style={{ color: colors.textSecondary }}>Didn't receive it? </Text>
          <Pressable onPress={handleResend} disabled={countdown > 0}>
            <Text style={{ color: countdown > 0 ? colors.textTertiary : colors.primary, fontWeight: '600' }}>
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: spacing[6], gap: spacing[4] },
  title: { fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold, marginTop: spacing[4] },
  subtitle: { fontSize: typography.sizes.base },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  otpRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] },
  otpBox: { flex: 1, height: 56, borderWidth: 2, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  otpChar: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[3] },
});
