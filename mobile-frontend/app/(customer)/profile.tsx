import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }   from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore }  from '../../src/store/appStore';
import { spacing, typography, radius } from '../../src/theme';

export default function Profile() {
  const { colors, isDark } = useTheme();
  const { user, logout }   = useAuthStore();
  const { isMockMode, setMockMode } = useAppStore();

  const doLogout = () =>
    Alert.alert('Log out?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);

  const rows = [
    { icon: 'receipt-outline' as const, label: 'Order History',  onPress: () => router.push('/(customer)/order/history') },
    { icon: 'location-outline' as const, label: 'Saved Addresses', onPress: () => {} },
    { icon: isDark ? 'sunny-outline' as const : 'moon-outline' as const, label: `${isDark ? 'Light' : 'Dark'} Mode`, onPress: () => {} },
    { icon: 'code-working-outline' as const, label: `Demo mode: ${isMockMode ? 'ON' : 'OFF'}`, onPress: () => setMockMode(!isMockMode) },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', onPress: () => {} },
    { icon: 'log-out-outline' as const, label: 'Log Out', onPress: doLogout, danger: true },
  ];

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView>
        <View style={[s.hero, { backgroundColor: colors.surface }]}>
          <View style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={s.avatarTxt}>{(user?.name ?? user?.phone ?? 'U')[0].toUpperCase()}</Text>
          </View>
          <Text style={[s.name, { color: colors.textPrimary }]}>{user?.name ?? 'My Account'}</Text>
          <Text style={[s.phone, { color: colors.textSecondary }]}>{user?.phone}</Text>
          {isMockMode && (
            <View style={[s.demoBadge, { backgroundColor: colors.info + '18', borderColor: colors.info }]}>
              <Text style={{ color: colors.info, fontSize: typography.sizes.sm, fontWeight: '600' }}>🎭 Demo mode active</Text>
            </View>
          )}
        </View>

        <View style={[s.menu, { backgroundColor: colors.surface }]}>
          {rows.map((row, i) => (
            <Pressable key={row.label} onPress={row.onPress}
              style={[s.row, i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Ionicons name={row.icon} size={20} color={row.danger ? colors.error : colors.textSecondary} />
              <Text style={[s.rowLabel, { color: row.danger ? colors.error : colors.textPrimary }]}>{row.label}</Text>
              {!row.danger && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
            </Pressable>
          ))}
        </View>

        <Text style={[s.version, { color: colors.textTertiary }]}>Zawadi Food v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1 },
  hero:      { alignItems: 'center', padding: spacing[6], gap: spacing[2] },
  avatar:    { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: typography.sizes['3xl'], fontWeight: '800' },
  name:      { fontSize: typography.sizes.xl, fontWeight: '700' },
  phone:     { fontSize: typography.sizes.base },
  demoBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, marginTop: spacing[2] },
  menu:      { marginTop: spacing[3], marginHorizontal: spacing[4], borderRadius: radius.lg, overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  rowLabel:  { flex: 1, fontSize: typography.sizes.base },
  version:   { textAlign: 'center', fontSize: typography.sizes.sm, marginTop: spacing[8] },
});
