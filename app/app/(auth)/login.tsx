import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '@/services/auth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui';
import { spacing, typography, borderRadius } from '@/theme';
import type { UserRole } from '@/types/api';

const ROLES: { label: string; value: UserRole; icon: string }[] = [
  { label: 'Customer', value: 'customer', icon: '🛒' },
  { label: 'Restaurant', value: 'restaurant_owner', icon: '🍽️' },
  { label: 'Rider', value: 'rider', icon: '🏍️' },
];

export default function Login() {
  const { colors } = useTheme();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (phone.trim().length < 7) {
      Toast.show({ type: 'error', text1: 'Enter a valid phone number' });
      return;
    }
    setLoading(true);
    try {
      await authApi.requestOtp(phone.trim());
      router.push({ pathname: '/(auth)/verify-otp', params: { phone: phone.trim(), role } });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to send OTP';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>Z</Text>
            </View>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>Zawadi Food</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Enter your phone number to continue
            </Text>
          </View>

          {/* Role selector */}
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[
                  styles.roleBtn,
                  {
                    borderColor: role === r.value ? colors.primary : colors.border,
                    backgroundColor: role === r.value ? colors.primary + '12' : colors.surface,
                  },
                ]}
              >
                <Text style={styles.roleEmoji}>{r.icon}</Text>
                <Text style={[styles.roleLabel, { color: role === r.value ? colors.primary : colors.textSecondary }]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Phone input */}
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 555 000 0000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              style={[styles.input, { color: colors.textPrimary }]}
              returnKeyType="done"
              onSubmitEditing={handleSend}
            />
          </View>

          <Button title="Send OTP" onPress={handleSend} loading={loading} fullWidth size="lg" style={{ marginTop: spacing[4] }} />

          <Text style={[styles.terms, { color: colors.textTertiary }]}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flexGrow: 1, padding: spacing[6], justifyContent: 'center', gap: spacing[4] },
  header: { alignItems: 'center', gap: spacing[2], marginBottom: spacing[4] },
  logoBox: { width: 72, height: 72, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  appName: { fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold },
  tagline: { fontSize: typography.sizes.base, textAlign: 'center' },
  roleRow: { flexDirection: 'row', gap: spacing[2] },
  roleBtn: { flex: 1, borderWidth: 1.5, borderRadius: borderRadius.md, padding: spacing[3], alignItems: 'center', gap: 4 },
  roleEmoji: { fontSize: 22 },
  roleLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: borderRadius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  input: { flex: 1, fontSize: typography.sizes.md },
  terms: { fontSize: typography.sizes.sm, textAlign: 'center', marginTop: spacing[3], lineHeight: 18 },
});
