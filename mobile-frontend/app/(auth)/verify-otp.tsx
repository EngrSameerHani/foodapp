import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme }     from '../../src/hooks/useTheme';
import { Toast }        from '../../src/components/ui';
import { authService }  from '../../src/services';
import { useAuthStore } from '../../src/store/authStore';
import { spacing, typography, radius } from '../../src/theme';
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
        <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-start' }}>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.base }}>← Back</Text>
        </Pressable>

        <Text style={[s.title, { color: colors.textPrimary }]}>Enter OTP</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>Sent to {phone}</Text>

        {/* Hidden real input drives the boxes */}
        <TextInput ref={inputRef} value={otp} onChangeText={handleChange}
          keyboardType="number-pad" maxLength={6}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} autoFocus />

        <Pressable onPress={() => inputRef.current?.focus()} style={s.boxes}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[s.box, { borderColor: i === otp.length ? colors.primary : colors.border, backgroundColor: colors.surface }]}>
              <Text style={[s.boxChar, { color: colors.textPrimary }]}>{otp[i] ?? ''}</Text>
            </View>
          ))}
        </Pressable>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing[4] }} />}

        <View style={s.resendRow}>
          <Text style={{ color: colors.textSecondary }}>Didn't receive it? </Text>
          <Pressable onPress={() => tick <= 0 && setTick(60)} disabled={tick > 0}>
            <Text style={{ color: tick > 0 ? colors.textTertiary : colors.primary, fontWeight: '600' }}>
              {tick > 0 ? `Resend in ${tick}s` : 'Resend'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  inner:    { flex: 1, padding: spacing[6], gap: spacing[4] },
  title:    { fontSize: typography.sizes['2xl'], fontWeight: '700', marginTop: spacing[4] },
  sub:      { fontSize: typography.sizes.base },
  boxes:    { flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] },
  box:      { flex: 1, height: 56, borderWidth: 2, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  boxChar:  { fontSize: typography.sizes.xl, fontWeight: '700' },
  resendRow:{ flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] },
});
