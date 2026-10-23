import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme }      from '../../src/hooks/useTheme';
import { useOrderStore } from '../../src/store/orderStore';
import { useAppStore }   from '../../src/store/appStore';
import { Badge, statusVariant, Empty, Toast } from '../../src/components/ui';
import { spacing, typography, radius, shadows } from '../../src/theme';
import { fmt } from '../../src/utils';
import type { Order, OrderStatus } from '../../src/types';

type Tab = 'New' | 'Active' | 'History';
const TAB_STATUSES: Record<Tab, string[]> = {
  New:     ['PLACED'],
  Active:  ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'],
  History: ['DELIVERED', 'REJECTED', 'CANCELLED', 'FAILED'],
};
const NEXT: Record<string, OrderStatus> = {
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP',
};

export default function RestaurantOrders() {
  const { colors } = useTheme();
  const { isMockMode } = useAppStore();
  const { restaurantOrders, transitionOrder } = useOrderStore();
  const [tab,      setTab]     = useState<Tab>('New');
  const [loading,  setLoading] = useState(false);

  const filtered = restaurantOrders.filter((o) => TAB_STATUSES[tab].includes(o.status));
  const newCount = restaurantOrders.filter((o) => o.status === 'PLACED').length;

  const accept = (o: Order) => {
    transitionOrder(o.id, 'ACCEPTED');
    Toast.show('Order accepted', 'success');
  };
  const reject = (o: Order) => {
    transitionOrder(o.id, 'REJECTED', 'Currently unavailable');
    Toast.show('Order rejected', 'info');
  };
  const advance = (o: Order) => {
    const next = NEXT[o.status];
    if (next) { transitionOrder(o.id, next); Toast.show(`Status → ${fmt.status(next)}`, 'success'); }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Orders</Text>
        <View style={[s.onlinePill, { backgroundColor: colors.success + '18', borderColor: colors.success }]}>
          <View style={[s.dot, { backgroundColor: colors.success }]} />
          <Text style={{ color: colors.success, fontSize: typography.sizes.sm, fontWeight: '600' }}>Open</Text>
        </View>
      </View>

      {/* tabs */}
      <View style={[s.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['New', 'Active', 'History'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[s.tabTxt, { color: tab === t ? colors.primary : colors.textSecondary }]}>{t}</Text>
            {t === 'New' && newCount > 0 && (
              <View style={[s.badge, { backgroundColor: colors.error }]}>
                <Text style={s.badgeTxt}>{newCount}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <FlatList data={filtered} keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => {}} tintColor={colors.primary} />}
        ListEmptyComponent={<Empty icon="receipt-outline" title={`No ${tab.toLowerCase()} orders`} />}
        renderItem={({ item: order }) => (
          <View style={[s.card, { backgroundColor: colors.surface }, shadows.sm]}>
            <View style={s.cardRow}>
              <Text style={[s.orderNum, { color: colors.textPrimary }]}>{order.order_number}</Text>
              <Badge label={fmt.status(order.status)} variant={statusVariant(order.status)} />
            </View>
            <Text style={[s.time, { color: colors.textSecondary }]}>{fmt.time(order.created_at)}</Text>
            <Text style={[s.items, { color: colors.textSecondary }]} numberOfLines={2}>
              {order.items.map((i) => `${i.quantity}× ${i.item_name}`).join(', ')}
            </Text>
            <View style={s.cardFooter}>
              <Text style={[s.total, { color: colors.textPrimary }]}>{fmt.currency(order.total)}</Text>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {order.status === 'PLACED' && (
                  <>
                    <Pressable onPress={() => reject(order)} style={[s.btn, { borderColor: colors.error }]}>
                      <Text style={{ color: colors.error, fontWeight: '600', fontSize: typography.sizes.sm }}>Reject</Text>
                    </Pressable>
                    <Pressable onPress={() => accept(order)} style={[s.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: typography.sizes.sm }}>Accept</Text>
                    </Pressable>
                  </>
                )}
                {(order.status === 'ACCEPTED' || order.status === 'PREPARING') && (
                  <Pressable onPress={() => advance(order)} style={[s.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: typography.sizes.sm }}>
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
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing[4] },
  title:      { fontSize: typography.sizes.xl, fontWeight: '700' },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1 },
  dot:        { width: 8, height: 8, borderRadius: 4 },
  tabs:       { flexDirection: 'row', borderBottomWidth: 1 },
  tab:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing[3] },
  tabTxt:     { fontSize: typography.sizes.base, fontWeight: '500' },
  badge:      { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  badgeTxt:   { color: '#fff', fontSize: 10, fontWeight: '700' },
  card:       { borderRadius: radius.lg, padding: spacing[4], gap: spacing[2] },
  cardRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNum:   { fontSize: typography.sizes.base, fontWeight: '700' },
  time:       { fontSize: typography.sizes.sm },
  items:      { fontSize: typography.sizes.sm, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[2] },
  total:      { fontSize: typography.sizes.lg, fontWeight: '700' },
  btn:        { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1.5 },
});
