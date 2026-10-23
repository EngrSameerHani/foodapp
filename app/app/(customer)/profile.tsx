import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { authApi } from '@/services/auth';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius } from '@/theme';

type MenuRow = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; tint?: string };

export default function ProfileScreen() {
  const { colors, isDark } = useTheme();
  const { user, refreshToken, logout } = useAuthStore();
  const { theme, setTheme } = useSettingsStore();

  const handleLogout = () => {
    Alert.alert('Log out?', 'You will need to verify your phone again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const rows: MenuRow[] = [
    { icon: 'receipt-outline', label: 'Order History', onPress: () => router.push('/(customer)/order/history') },
    { icon: 'location-outline', label: 'Saved Addresses', onPress: () => {} },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
    { icon: isDark ? 'sunny-outline' : 'moon-outline', label: isDark ? 'Light Mode' : 'Dark Mode', onPress: () => setTheme(isDark ? 'light' : 'dark') },
    { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
    { icon: 'log-out-outline', label: 'Log Out', onPress: handleLogout, tint: colors.error },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Avatar + name */}
        <View style={[styles.hero, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{(user?.name ?? user?.phone ?? 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name ?? 'Your Account'}</Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{user?.phone}</Text>
        </View>

        {/* Menu rows */}
        <View style={[styles.menu, { backgroundColor: colors.surface }]}>
          {rows.map((row, idx) => (
            <Pressable
              key={row.label}
              onPress={row.onPress}
              style={[styles.menuRow, idx < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Ionicons name={row.icon} size={20} color={row.tint ?? colors.textSecondary} />
              <Text style={[styles.menuLabel, { color: row.tint ?? colors.textPrimary }]}>{row.label}</Text>
              {!row.tint && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
            </Pressable>
          ))}
        </View>

        <Text style={[styles.version, { color: colors.textTertiary }]}>Zawadi Food v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', padding: spacing[6], gap: spacing[2] },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: typography.sizes['3xl'], fontWeight: typography.weights.bold },
  name: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  phone: { fontSize: typography.sizes.base },
  menu: { marginTop: spacing[3], marginHorizontal: spacing[4], borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  menuLabel: { flex: 1, fontSize: typography.sizes.base },
  version: { textAlign: 'center', fontSize: typography.sizes.sm, marginTop: spacing[8] },
});
