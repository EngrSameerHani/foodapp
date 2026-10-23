import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius } from '@/theme';

export default function RestaurantProfileScreen() {
  const { colors } = useTheme();
  const { user, refreshToken, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log out?', '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out', style: 'destructive', onPress: async () => {
          if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={[styles.hero, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="storefront" size={40} color="#fff" />
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name ?? 'My Restaurant'}</Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{user?.phone}</Text>
        </View>

        <View style={[styles.menu, { backgroundColor: colors.surface }]}>
          {[
            { icon: 'time-outline' as const, label: 'Opening Hours', onPress: () => {} },
            { icon: 'location-outline' as const, label: 'Delivery Zones', onPress: () => {} },
            { icon: 'settings-outline' as const, label: 'Restaurant Settings', onPress: () => {} },
            { icon: 'log-out-outline' as const, label: 'Log Out', onPress: handleLogout, tint: colors.error },
          ].map((row, idx, arr) => (
            <Pressable
              key={row.label}
              onPress={row.onPress}
              style={[styles.menuRow, idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Ionicons name={row.icon} size={20} color={row.tint ?? colors.textSecondary} />
              <Text style={[styles.menuLabel, { color: row.tint ?? colors.textPrimary }]}>{row.label}</Text>
              {!row.tint && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', padding: spacing[6], gap: spacing[2] },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  phone: { fontSize: typography.sizes.base },
  menu: { marginTop: spacing[3], marginHorizontal: spacing[4], borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  menuLabel: { flex: 1, fontSize: typography.sizes.base },
});
