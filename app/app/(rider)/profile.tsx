import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth';
import { riderApi } from '@/services/rider';
import { useTheme } from '@/hooks/useTheme';
import { spacing, typography, borderRadius } from '@/theme';
import { formatCurrency } from '@/utils/format';

export default function RiderProfileScreen() {
  const { colors } = useTheme();
  const { user, refreshToken, logout } = useAuthStore();
  const { data: profile } = useQuery({
    queryKey: ['rider-profile'],
    queryFn: () => riderApi.getProfile().then((r) => r.data),
  });

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
            <Ionicons name="bicycle" size={40} color="#fff" />
          </View>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name ?? 'Rider'}</Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{user?.phone}</Text>
          {profile && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{profile.total_deliveries}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Deliveries</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{formatCurrency(profile.total_earnings)}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Earned</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statVal, { color: colors.primary }]}>{profile.rating.toFixed(1)} ⭐</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
              </View>
            </View>
          )}
        </View>

        <View style={[styles.menu, { backgroundColor: colors.surface }]}>
          <Pressable onPress={handleLogout} style={styles.menuRow}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.menuLabel, { color: colors.error }]}>Log Out</Text>
          </Pressable>
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
  statsRow: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[3] },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  statLabel: { fontSize: typography.sizes.sm },
  menu: { marginTop: spacing[3], marginHorizontal: spacing[4], borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  menuLabel: { flex: 1, fontSize: typography.sizes.base },
});
