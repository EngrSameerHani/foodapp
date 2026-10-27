import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme }      from '../../src/hooks/useTheme';
import { useOrderStore } from '../../src/store/orderStore';
import { Toast }         from '../../src/components/ui';
import { Empty }         from '../../src/components/ui';
import { palette, spacing, radius, typography, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { Order, OrderStatus } from '../../src/types';

type Tab = 'New' | 'Active' | 'History';
const TAB_STATUSES: Record<Tab, string[]> = {
  New:     ['PLACED'],
  Active:  ['ACCEPTED','PREPARING','READY_FOR_PICKUP'],
  History: ['DELIVERED','REJECTED','CANCELLED','FAILED'],
};
const NEXT: Record<string, OrderStatus> = { ACCEPTED: 'PREPARING', PREPARING: 'READY_FOR_PICKUP' };

export default function RestaurantOrders() {
  const { colors } = useTheme();
  const { restaurantOrders, transitionOrder } = useOrderStore();
  const [tab, setTab] = useState<Tab>('New');
  const filtered = restaurantOrders.filter((o) => TAB_STATUSES[tab].includes(o.status));
  const newCount = restaurantOrders.filter((o) => o.status === 'PLACED').length;

  const accept  = (o: Order) => { transitionOrder(o.id, 'ACCEPTED'); Toast.show('Order accepted ✓', 'success'); };
  const reject  = (o: Order) => { transitionOrder(o.id, 'REJECTED', 'Unavailable'); Toast.show('Order rejected', 'info'); };
  const advance = (o: Order) => { const n = NEXT[o.status]; if (n) { transitionOrder(o.id, n); Toast.show(`→ ${fmt.status(n)}`, 'success'); } };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <View>
          <Text style={[s.title, { color: colors.textPrimary }]}>Orders</Text>
          <Text style={[s.sub, { color: colors.textSecondary }]}>Manage incoming orders</Text>
        </View>
        <View style={[s.onlinePill, { backgroundColor: palette.successBg }]}>
          <View style={[s.onlineDot, { backgroundColor: palette.success }]} />
          <Text style={[s.onlineTxt, { color: palette.success }]}>Open</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[s.statsRow, { backgroundColor: colors.surface }]}>
        {[
          { label: "Today's Orders", value: restaurantOrders.length.toString(), icon: 'receipt-outline' },
          { label: 'Pending',        value: newCount.toString(),               icon: 'time-outline' },
          { label: 'Completed',      value: restaurantOrders.filter(o=>o.status==='DELIVERED').length.toString(), icon: 'checkmark-circle-outline' },
        ].map((st, i, arr) => (
          <React.Fragment key={st.label}>
            <View style={s.statItem}>
              <Text style={[s.statVal, { color: palette.orange }]}>{st.value}</Text>
              <Text style={[s.statLabel, { color: colors.textSecondary }]}>{st.label}</Text>
            </View>
            {i < arr.length - 1 && <View style={[s.statDiv, { backgroundColor: colors.divider }]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { backgroundColor: colors.surface }]}>
        {(['New', 'Active', 'History'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabTxt, { color: tab === t ? palette.orange : colors.textSecondary }]}>{t}</Text>
            {t === 'New' && newCount > 0 && (
              <View style={s.badge}><Text style={s.badgeTxt}>{newCount}</Text></View>
            )}
            {tab === t && <View style={[s.tabLine, { backgroundColor: palette.orange }]} />}
          </Pressable>
        ))}
      </View>

      <FlatList data={filtered} keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} tintColor={palette.orange} />}
        ListEmptyComponent={<Empty icon="receipt-outline" title={`No ${tab.toLowerCase()} orders`} />}
        renderItem={({ item: order }) => (
          <View style={[s.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={s.cardHeader}>
              <View style={[s.orderBadge, { backgroundColor: order.status === 'PLACED' ? '#FEF3C7' : palette.orangeBg }]}>
                <Text style={[s.orderBadgeTxt, { color: order.status === 'PLACED' ? '#92400E' : palette.orange }]}>
                  {order.status === 'PLACED' ? '🔴 NEW' : fmt.status(order.status)}
                </Text>
              </View>
              <Text style={[s.orderNum, { color: colors.textSecondary }]}>{order.order_number}</Text>
              <Text style={[s.orderTime, { color: colors.textTertiary }]}>{fmt.time(order.created_at)}</Text>
            </View>
            <Text style={[s.items, { color: colors.textSecondary }]} numberOfLines={2}>
              {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
            </Text>
            <View style={s.cardFooter}>
              <Text style={[s.total, { color: colors.textPrimary }]}>{fmt.currency(order.total)}</Text>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {order.status === 'PLACED' && (
                  <>
                    <Pressable onPress={() => reject(order)} style={[s.actionBtn, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[s.actionTxt, { color: palette.error }]}>Reject</Text>
                    </Pressable>
                    <Pressable onPress={() => accept(order)} style={[s.actionBtn, { backgroundColor: palette.orange }]}>
                      <Text style={[s.actionTxt, { color: '#fff' }]}>Accept</Text>
                    </Pressable>
                  </>
                )}
                {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                  <Pressable onPress={() => advance(order)} style={[s.actionBtn, { backgroundColor: palette.orange }]}>
                    <Text style={[s.actionTxt, { color: '#fff' }]}>
                      {order.status === 'ACCEPTED' ? 'Start Preparing' : 'Mark Ready'}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title:       { fontSize: typography.sizes.xl, fontWeight: '700' },
  sub:         { fontSize: typography.sizes.sm },
  onlinePill:  { flexDirection: 'row', alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full },
  onlineDot:   { width: 8, height: 8, borderRadius: 4 },
  onlineTxt:   { fontSize: typography.sizes.sm, fontWeight: '600' },
  statsRow:    { flexDirection: 'row', paddingHorizontal: spacing[4], paddingBottom: spacing[4] },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statVal:     { fontSize: typography.sizes.xl, fontWeight: '800' },
  statLabel:   { fontSize: typography.sizes.xs, textAlign: 'center' },
  statDiv:     { width: 1, height: 36, alignSelf: 'center' },
  tabs:        { flexDirection: 'row', borderBottomWidth: 1 },
  tab:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[1], paddingVertical: spacing[3], position: 'relative' },
  tabActive:   {},
  tabLine:     { position: 'absolute', bottom: 0, left: '10%', right: '10%', height: 3, borderRadius: 2 },
  tabTxt:      { fontSize: typography.sizes.base, fontWeight: '600' },
  badge:       { width: 18, height: 18, borderRadius: 9, backgroundColor: palette.error, alignItems: 'center', justifyContent: 'center' },
  badgeTxt:    { color: '#fff', fontSize: 10, fontWeight: '800' },
  card:        { borderRadius: radius.xl, padding: spacing[4], gap: spacing[2] },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  orderBadge:  { paddingHorizontal: spacing[2], paddingVertical: 3, borderRadius: radius.sm },
  orderBadgeTxt:{ fontSize: typography.sizes.sm, fontWeight: '700' },
  orderNum:    { flex: 1, fontSize: typography.sizes.sm, fontWeight: '500' },
  orderTime:   { fontSize: typography.sizes.sm },
  items:       { fontSize: typography.sizes.sm, lineHeight: 18 },
  cardFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[1] },
  total:       { fontSize: typography.sizes.lg, fontWeight: '800' },
  actionBtn:   { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full },
  actionTxt:   { fontSize: typography.sizes.sm, fontWeight: '700' },
});
