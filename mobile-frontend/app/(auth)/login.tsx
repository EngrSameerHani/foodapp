import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { authService } from '../../src/services';
import { useAppStore } from '../../src/store/appStore';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';
import { Toast } from '../../src/components/ui';
import type { UserRole } from '../../src/types';

const ROLES: { label: string; value: UserRole; icon: string }[] = [
  { label: 'Customer',   value: 'customer',         icon: '🛒' },
  { label: 'Restaurant', value: 'restaurant_owner', icon: '🍽️' },
  { label: 'Rider',      value: 'rider',            icon: '🏍️' },
];

export default function Login() {
  const { colors } = useTheme();
  const { isMockMode } = useAppStore();
  const [phone,   setPhone]   = useState('');
  const [role,    setRole]    = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (phone.trim().length < 7) { Toast.show('Enter a valid phone number', 'error'); return; }
    setLoading(true);
    try {
      await authService.requestOtp(phone.trim());
      router.push({ pathname: '/(auth)/verify-otp', params: { phone: phone.trim(), role } });
    } catch (e: unknown) {
      Toast.show((e as { message?: string })?.message ?? 'Failed to send OTP', 'error');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoCircle}>
              <Text style={s.logoIcon}>🍴</Text>
            </View>
            <Text style={[s.appName, { color: colors.textPrimary }]}>FoodZap</Text>
            <Text style={[s.appSub, { color: colors.textSecondary }]}>Good Food. Faster.</Text>
          </View>

          {/* Card */}
          <View style={[s.card, { backgroundColor: colors.surface }, shadows.md]}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Welcome Back 👋</Text>
            <Text style={[s.cardSub, { color: colors.textSecondary }]}>Sign in to continue</Text>

            {/* Mock mode pill */}
            {isMockMode && (
              <View style={[s.mockPill, { backgroundColor: colors.primaryBg }]}>
                <Ionicons name="information-circle" size={14} color={palette.orange} />
                <Text style={[s.mockText, { color: palette.orange }]}>
                  Demo mode — OTP is <Text style={{ fontWeight: '700' }}>123456</Text>
                </Text>
              </View>
            )}

            {/* Role selector */}
            <Text style={[s.label, { color: colors.textSecondary }]}>I am a</Text>
            <View style={s.roleRow}>
              {ROLES.map((r) => {
                const active = role === r.value;
                return (
                  <Pressable key={r.value} onPress={() => setRole(r.value)}
                    style={[s.roleBtn, {
                      borderColor: active ? palette.orange : colors.border,
                      backgroundColor: active ? palette.orange : colors.surface,
                    }]}>
                    <Text style={s.roleEmoji}>{r.icon}</Text>
                    <Text style={[s.roleLabel, { color: active ? '#fff' : colors.textSecondary }]}>
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Phone input */}
            <Text style={[s.label, { color: colors.textSecondary }]}>Phone Number</Text>
            <View style={[s.inputWrap, { borderColor: phone.length > 0 ? palette.orange : colors.border, backgroundColor: colors.inputBg }]}>
              <Ionicons name="call-outline" size={20} color={phone.length > 0 ? palette.orange : colors.textTertiary} />
              <TextInput
                value={phone} onChangeText={setPhone}
                placeholder="+1 555 000 0001"
                placeholderTextColor={colors.textTertiary}
                keyboardType="phone-pad"
                style={[s.input, { color: colors.textPrimary }]}
                returnKeyType="done"
                onSubmitEditing={send}
              />
            </View>

            {/* CTA */}
            <Pressable onPress={send} disabled={loading}
              style={[s.cta, { opacity: loading ? 0.7 : 1 }]}>
              {loading
                ? <Text style={s.ctaText}>Sending…</Text>
                : <><Text style={s.ctaText}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" /></>}
            </Pressable>

            {/* Demo hint */}
            {isMockMode && (
              <View style={{ gap: 2, marginTop: spacing[2] }}>
                <Text style={[s.demoHint, { color: colors.textTertiary }]}>Demo accounts:</Text>
                {['+15550000001 — Customer', '+15550000010 — Restaurant', '+15550000020 — Rider'].map((n) => (
                  <Text key={n} style={[s.demoHint, { color: colors.textSecondary }]}>  {n}</Text>
                ))}
              </View>
            )}
          </View>

          <Text style={[s.terms, { color: colors.textTertiary }]}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  scroll:     { flexGrow: 1, padding: spacing[5], justifyContent: 'center', gap: spacing[5] },

  logoWrap:   { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  logoCircle: { width: 72, height: 72, borderRadius: radius.xl, backgroundColor: palette.orange, alignItems: 'center', justifyContent: 'center', ...shadows.card },
  logoIcon:   { fontSize: 32 },
  appName:    { fontSize: typography.sizes['2xl'], fontWeight: '800' },
  appSub:     { fontSize: typography.sizes.base },

  card:       { borderRadius: radius['2xl'], padding: spacing[5], gap: spacing[3] },
  cardTitle:  { fontSize: typography.sizes.xl, fontWeight: '700' },
  cardSub:    { fontSize: typography.sizes.base, marginTop: -spacing[2] },

  mockPill:   { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  mockText:   { fontSize: typography.sizes.sm },

  label:      { fontSize: typography.sizes.base, fontWeight: '500' },

  roleRow:    { flexDirection: 'row', gap: spacing[2] },
  roleBtn:    { flex: 1, borderWidth: 1.5, borderRadius: radius.lg, paddingVertical: spacing[3], alignItems: 'center', gap: spacing[1] },
  roleEmoji:  { fontSize: 20 },
  roleLabel:  { fontSize: typography.sizes.sm, fontWeight: '500' },

  inputWrap:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2], borderWidth: 1.5, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  input:      { flex: 1, fontSize: typography.sizes.body },

  cta:        { flexDirection: 'row', backgroundColor: palette.orange, borderRadius: radius.full, paddingVertical: spacing[4], alignItems: 'center', justifyContent: 'center', gap: spacing[2], ...shadows.card },
  ctaText:    { color: '#fff', fontSize: typography.sizes.body, fontWeight: '700' },

  demoHint:   { fontSize: typography.sizes.sm, lineHeight: 20 },
  terms:      { fontSize: typography.sizes.sm, textAlign: 'center', lineHeight: 18 },
});
