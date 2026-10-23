import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }    from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { spacing, typography, radius } from '../../src/theme';

export default function RestaurantProfile() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
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
            <Ionicons name="storefront" size={40} color="#fff" />
          </View>
          <Text style={[s.name, { color: colors.textPrimary }]}>{user?.name ?? 'My Restaurant'}</Text>
          <Text style={[s.phone, { color: colors.textSecondary }]}>{user?.phone}</Text>
        </View>
        <View style={[s.menu, { backgroundColor: colors.surface }]}>
          {[
            { icon: 'time-outline' as const,     label: 'Opening Hours',        onPress: () => {} },
            { icon: 'location-outline' as const, label: 'Delivery Zones',       onPress: () => {} },
            { icon: 'settings-outline' as const, label: 'Restaurant Settings',  onPress: () => {} },
            { icon: 'log-out-outline' as const,  label: 'Log Out',              onPress: doLogout, danger: true },
          ].map((row, i, arr) => (
            <Pressable key={row.label} onPress={row.onPress}
              style={[s.row, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Ionicons name={row.icon} size={20} color={row.danger ? colors.error : colors.textSecondary} />
              <Text style={[s.rowLabel, { color: row.danger ? colors.error : colors.textPrimary }]}>{row.label}</Text>
              {!row.danger && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  hero:    { alignItems: 'center', padding: spacing[6], gap: spacing[2] },
  avatar:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  name:    { fontSize: typography.sizes.xl, fontWeight: '700' },
  phone:   { fontSize: typography.sizes.base },
  menu:    { marginTop: spacing[3], marginHorizontal: spacing[4], borderRadius: radius.lg, overflow: 'hidden' },
  row:     { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  rowLabel:{ flex: 1, fontSize: typography.sizes.base },
});
