import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }    from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useAppStore }  from '../../src/store/appStore';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';

type MenuRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
};

export default function Profile() {
  const { colors } = useTheme();
  const { user, logout }   = useAuthStore();
  const { isMockMode, setMockMode } = useAppStore();

  const doLogout = () => Alert.alert('Log out?', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
  ]);

  const sections: { title: string; rows: MenuRow[] }[] = [
    {
      title: 'My Account',
      rows: [
        { icon: 'receipt-outline',  label: 'My Orders',       sub: 'Track, re-order, rate',      onPress: () => router.push('/(customer)/order/history') },
        { icon: 'location-outline', label: 'Addresses',        sub: 'Manage delivery addresses',  onPress: () => {} },
        { icon: 'card-outline',     label: 'Payment Methods', sub: 'Cards, cash, wallets',       onPress: () => {} },
        { icon: 'pricetag-outline', label: 'Promo Codes',     sub: 'View available offers',      onPress: () => router.push('/(customer)/cart') },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        { icon: 'notifications-outline', label: 'Notifications', sub: 'Order updates & offers', onPress: () => {} },
        { icon: 'help-circle-outline',   label: 'Help & Support', sub: 'FAQs, contact us',      onPress: () => {} },
        { icon: 'settings-outline',      label: 'Settings',       sub: 'App preferences',       onPress: () => {} },
        {
          icon: (isMockMode ? 'code-working-outline' : 'wifi-outline') as keyof typeof Ionicons.glyphMap,
          label: `Demo Mode: ${isMockMode ? 'ON' : 'OFF'}`,
          sub: isMockMode ? 'Using local data' : 'Using live backend',
          onPress: () => setMockMode(!isMockMode),
          badge: isMockMode ? 'DEMO' : undefined,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[st.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[st.heroCard, { backgroundColor: palette.orange }]}>
          <View style={st.heroTop}>
            <Text style={st.heroTitle}>Profile</Text>
            <Pressable style={[st.editBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={st.editTxt}>Edit</Text>
            </Pressable>
          </View>
          {/* Avatar */}
          <View style={st.avatarWrap}>
            <View style={[st.avatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={st.avatarTxt}>{(user?.name ?? user?.phone ?? 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={[st.avatarBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name="camera" size={12} color={palette.orange} />
            </View>
          </View>
          <Text style={st.userName}>{user?.name ?? 'Your Name'}</Text>
          <Text style={st.userPhone}>{user?.phone}</Text>
        </View>

        {/* Stats strip */}
        <View style={[st.statsCard, { backgroundColor: colors.surface }, shadows.sm]}>
          {[
            { label: 'Orders', value: '24', icon: 'receipt-outline' },
            { label: 'Saved', value: '8', icon: 'heart-outline' },
            { label: 'Reviews', value: '12', icon: 'star-outline' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={st.statItem}>
                <Text style={[st.statVal, { color: palette.orange }]}>{s.value}</Text>
                <Text style={[st.statLabel, { color: colors.textSecondary }]}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={[st.statDiv, { backgroundColor: colors.divider }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Menu sections */}
        {sections.map((sec) => (
          <View key={sec.title} style={{ marginHorizontal: spacing[4], marginBottom: spacing[3] }}>
            <Text style={[st.sectionLabel, { color: colors.textSecondary }]}>{sec.title}</Text>
            <View style={[st.menuCard, { backgroundColor: colors.surface }, shadows.sm]}>
              {sec.rows.map((row, i) => (
                <Pressable key={row.label} onPress={row.onPress}
                  style={[st.menuRow, i < sec.rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
                  <View style={[st.menuIcon, { backgroundColor: row.danger ? '#FEE2E2' : colors.background }]}>
                    <Ionicons name={row.icon} size={20} color={row.danger ? palette.error : palette.orange} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.menuLabel, { color: row.danger ? palette.error : colors.textPrimary }]}>{row.label}</Text>
                    {row.sub && <Text style={[st.menuSub, { color: colors.textSecondary }]}>{row.sub}</Text>}
                  </View>
                  {row.badge && (
                    <View style={[st.badge, { backgroundColor: palette.orangeBg }]}>
                      <Text style={[st.badgeTxt, { color: palette.orange }]}>{row.badge}</Text>
                    </View>
                  )}
                  {!row.danger && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <Pressable onPress={doLogout} style={[st.logoutBtn, { backgroundColor: '#FEE2E2', marginHorizontal: spacing[4] }]}>
          <Ionicons name="log-out-outline" size={20} color={palette.error} />
          <Text style={[st.logoutTxt, { color: palette.error }]}>Log Out</Text>
        </Pressable>

        <Text style={[st.version, { color: colors.textTertiary }]}>Zawadi Food v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root:      { flex: 1 },

  heroCard:  { paddingTop: spacing[6], paddingBottom: spacing[8], alignItems: 'center', gap: spacing[1] },
  heroTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: spacing[4], marginBottom: spacing[3] },
  heroTitle: { fontSize: typography.sizes.xl, fontWeight: '700', color: '#fff' },
  editBtn:   { paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full },
  editTxt:   { color: '#fff', fontSize: typography.sizes.base, fontWeight: '600' },

  avatarWrap:{ position: 'relative' },
  avatar:    { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarTxt: { fontSize: 40, color: '#fff', fontWeight: '800' },
  avatarBadge:{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  userName:  { fontSize: typography.sizes.xl, fontWeight: '700', color: '#fff', marginTop: spacing[2] },
  userPhone: { fontSize: typography.sizes.base, color: 'rgba(255,255,255,0.8)' },

  statsCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing[4], marginTop: -spacing[5], borderRadius: radius.xl, padding: spacing[4] },
  statItem:  { flex: 1, alignItems: 'center', gap: 2 },
  statVal:   { fontSize: typography.sizes.xl, fontWeight: '800' },
  statLabel: { fontSize: typography.sizes.sm },
  statDiv:   { width: 1, height: 36 },

  sectionLabel:{ fontSize: typography.sizes.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing[2], marginTop: spacing[3] },
  menuCard:  { borderRadius: radius.xl, overflow: 'hidden' },
  menuRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4] },
  menuIcon:  { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: typography.sizes.base, fontWeight: '500' },
  menuSub:   { fontSize: typography.sizes.sm, marginTop: 1 },
  badge:     { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.sm, marginRight: spacing[1] },
  badgeTxt:  { fontSize: typography.sizes.xs, fontWeight: '700' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[4], borderRadius: radius.xl, marginBottom: spacing[4] },
  logoutTxt: { fontSize: typography.sizes.body, fontWeight: '700' },

  version:   { textAlign: 'center', fontSize: typography.sizes.sm, marginBottom: spacing[8] },
});
