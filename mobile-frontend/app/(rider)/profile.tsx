import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }    from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { riderService } from '../../src/services';
import { spacing, typography, radius } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { RiderProfile } from '../../src/types';

export default function RiderProfile() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<RiderProfile | null>(null);

  useEffect(() => { riderService.getProfile().then(setProfile); }, []);

  const doLogout = () =>
    Alert.alert('Log out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={[s.hero, { backgroundColor: colors.surface }]}>
          <View style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="bicycle" size={40} color="#fff" />
          </View>
          <Text style={[s.name, { color: colors.textPrimary }]}>{user?.name ?? 'Rider'}</Text>
          <Text style={[s.phone, { color: colors.textSecondary }]}>{user?.phone}</Text>
          {profile && (
            <View style={s.statsRow}>
              {[
                { label: 'Deliveries', value: profile.total_deliveries.toString() },
                { label: 'Earned',     value: fmt.currency(profile.total_earnings) },
                { label: 'Rating',     value: `${profile.rating.toFixed(1)} ⭐` },
              ].map((st) => (
                <View key={st.label} style={s.stat}>
                  <Text style={[s.statVal, { color: colors.primary }]}>{st.value}</Text>
                  <Text style={[s.statLabel, { color: colors.textSecondary }]}>{st.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[s.menu, { backgroundColor: colors.surface }]}>
          <Pressable onPress={doLogout} style={s.row}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[s.rowLabel, { color: colors.error }]}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  hero:      { alignItems: 'center', padding: spacing[6], gap: spacing[2] },
  avatar:    { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  name:      { fontSize: typography.sizes.xl, fontWeight: '700' },
  phone:     { fontSize: typography.sizes.base },
  statsRow:  { flexDirection: 'row', gap: spacing[8], marginTop: spacing[3] },
  stat:      { alignItems: 'center', gap: 2 },
  statVal:   { fontSize: typography.sizes.lg, fontWeight: '700' },
  statLabel: { fontSize: typography.sizes.sm },
  menu:      { marginTop: spacing[3], marginHorizontal: spacing[4], borderRadius: radius.lg, overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  rowLabel:  { flex: 1, fontSize: typography.sizes.base },
});
