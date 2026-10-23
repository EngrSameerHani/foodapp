import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }   from '../../src/hooks/useTheme';
import { Button, Toast } from '../../src/components/ui';
import { useAppStore } from '../../src/store/appStore';
import { authService } from '../../src/services';
import { spacing, typography, radius } from '../../src/theme';
import type { UserRole } from '../../src/types';

const ROLES: { label: string; value: UserRole; emoji: string }[] = [
  { label: 'Customer',   value: 'customer',          emoji: '🛒' },
  { label: 'Restaurant', value: 'restaurant_owner',  emoji: '🍽️' },
  { label: 'Rider',      value: 'rider',             emoji: '🏍️' },
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
        <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={s.logo}>
            <View style={[s.logoBox, { backgroundColor: colors.primary }]}>
              <Text style={s.logoLetter}>Z</Text>
            </View>
            <Text style={[s.appName, { color: colors.textPrimary }]}>Zawadi Food</Text>
            <Text style={[s.tagline, { color: colors.textSecondary }]}>Enter your phone number to continue</Text>
          </View>

          {/* Mock mode banner */}
          {isMockMode && (
            <View style={[s.mockBanner, { backgroundColor: colors.info + '18', borderColor: colors.info }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.info} />
              <Text style={[s.mockText, { color: colors.info }]}>
                Demo mode — OTP is always <Text style={{ fontWeight: '700' }}>123456</Text>
              </Text>
            </View>
          )}

          {/* Role selector */}
          <View style={s.roles}>
            {ROLES.map((r) => (
              <Pressable key={r.value} onPress={() => setRole(r.value)}
                style={[s.roleBtn, { borderColor: role === r.value ? colors.primary : colors.border, backgroundColor: role === r.value ? colors.primary + '12' : colors.surface }]}>
                <Text style={s.roleEmoji}>{r.emoji}</Text>
                <Text style={[s.roleLabel, { color: role === r.value ? colors.primary : colors.textSecondary }]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Phone input */}
          <View style={[s.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
            <TextInput
              value={phone} onChangeText={setPhone}
              placeholder="+1 555 000 0001" placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad" style={[s.input, { color: colors.textPrimary }]}
              returnKeyType="done" onSubmitEditing={send}
            />
          </View>

          <Button title="Send OTP" onPress={send} loading={loading} fullWidth size="lg" style={{ marginTop: spacing[4] }} />

          {/* Demo hint */}
          {isMockMode && (
            <View style={{ marginTop: spacing[5] }}>
              <Text style={[s.demoHint, { color: colors.textTertiary }]}>Demo phone numbers:</Text>
              {['+15550000001 (Customer)', '+15550000010 (Restaurant)', '+15550000020 (Rider)'].map((n) => (
                <Text key={n} style={[s.demoHint, { color: colors.textSecondary }]}>  {n}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },
  inner:      { flexGrow: 1, padding: spacing[6], justifyContent: 'center', gap: spacing[4] },
  logo:       { alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  logoBox:    { width: 72, height: 72, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#fff', fontSize: 36, fontWeight: '800' },
  appName:    { fontSize: typography.sizes['2xl'], fontWeight: '700' },
  tagline:    { fontSize: typography.sizes.base, textAlign: 'center' },
  mockBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: spacing[3], borderRadius: radius.md, borderWidth: 1 },
  mockText:   { fontSize: typography.sizes.sm, flex: 1 },
  roles:      { flexDirection: 'row', gap: spacing[2] },
  roleBtn:    { flex: 1, borderWidth: 1.5, borderRadius: radius.md, padding: spacing[3], alignItems: 'center', gap: 4 },
  roleEmoji:  { fontSize: 22 },
  roleLabel:  { fontSize: typography.sizes.sm, fontWeight: '500' },
  inputRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  input:      { flex: 1, fontSize: typography.sizes.md },
  demoHint:   { fontSize: typography.sizes.sm, lineHeight: 20 },
});
